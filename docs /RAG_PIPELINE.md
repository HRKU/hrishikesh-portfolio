# RAG Pipeline — Portfolio Chatbot

**Status:** Implemented (June 2026)  
**Scope:** Resume-grounded retrieval for the `/api/chat` endpoint

This document describes the full Retrieval-Augmented Generation (RAG) pipeline: offline chunking and embedding, runtime query embedding, cosine similarity search, and non-fatal prompt injection.

---

## Architecture

```text
OFFLINE (local / CI — run when resume data changes)
──────────────────────────────────────────────────
data/resumes/*.tex|pdf
        ↓  pnpm chunk:resume
data/chunks/*-resume.json          (19 chunks total)
        ↓  pnpm embed:resume  (+ HF_INFERENCE_KEY)
data/chunks/*-resume-embedded.json   (chunks + 384-dim vectors)

RUNTIME (every chat request on Netlify)
───────────────────────────────────────
User message
        ↓
Static cache hit?  → return cached answer (RAG skipped)
        ↓
Greeting / short query?  → skip RAG
        ↓
Embed query via Hugging Face Inference API
        ↓
Filter by threshold (≥ 0.45) → top 8 candidates
        ↓
Heuristic re-rank: tag overlap + title boost + MMR diversity + title dedup → top 3
        ↓
Inject context into system prompt
        ↓
Groq LLM stream response
```

RAG is **non-fatal**: if `HF_INFERENCE_KEY` is missing, HF times out, or embedding fails, the chatbot continues with the base system prompt only.

---

## Key files

| File | Role |
|------|------|
| `scripts/chunk-resume.mjs` | Parse resume sources into JSON chunks |
| `scripts/embed-chunks.mjs` | Batch-embed chunks via Hugging Face (offline) |
| `config/embedding.js` | Shared model URL, timeout, greeting-skip rules |
| `data/chunks/*-embedded.json` | Pre-computed vectors (bundled at build time) |
| `app/api/chat/utils/rag.js` | Runtime embed + retrieval + heuristic re-rank |
| `app/api/chat/route.js` | Calls `retrieveContext()` before Groq (step 6 in request lifecycle) |

---

## Configuration

### Environment variables

| Variable | Where | Required |
|----------|-------|----------|
| `GROQ_API_KEY` | Netlify + local `.env` | Yes (LLM) |
| `HF_INFERENCE_KEY` | Netlify + local `.env` | Yes for RAG (chat works without it) |

Get a Hugging Face token: https://huggingface.co/settings/tokens

### Shared embedding model

Both offline and runtime **must** use the same model (defined in `config/embedding.js`):

```text
BAAI/bge-small-en-v1.5  →  384-dimensional vectors
```

### Runtime tuning constants (`rag.js` + `config/embedding.js`)

| Constant | Value | Purpose |
|----------|-------|---------|
| `SIMILARITY_THRESHOLD` | `0.45` | Min cosine score to inject a chunk |
| `DEFAULT_TOP_K` | `3` | Max chunks injected per query |
| `HF_FETCH_TIMEOUT_MS` | `3000` | Abort slow HF requests |
| `MIN_RAG_QUERY_WORDS` | `3` | Skip RAG for very short queries |
| `RAG_GREETING_PATTERN` | regex | Skip RAG for hi/hello/etc. |

`embedQuery` retries once on 503 (model cold start) or network errors.

### Heuristic re-rank (stage 2)

After bi-encoder cosine search, the top **8 candidates** (above threshold) pass through a **rule-based** re-ranker — no extra API call.

| Signal | Weight | What it does |
|--------|--------|--------------|
| Bi-encoder score | 65% | Original cosine similarity from embeddings |
| Tag overlap | 25% | Query words matching chunk `tags`, `title`, or `section` |
| Title boost | +0.15 | Distinctive title words (length > 4) appear in the query |
| MMR selection | λ=0.7 | Balances relevance vs diversity among candidates |
| Title dedup | hard rule | Only one chunk per `title` (fixes duplicate Run2Feed slots) |

**Heuristic** = simple hand-crafted rules, not a learned model. Fast and free at 19-chunk scale.

---

## Offline workflow

When resume content changes:

```bash
# 1. Chunk resumes
pnpm chunk:resume -- --input data/resumes/ai-resume.tex --output data/chunks/ai-resume.json --resume-type ai
pnpm chunk:resume -- --input data/resumes/fullstack-resume.pdf --output data/chunks/fullstack-resume.json --resume-type fullstack

# 2. Embed chunks (requires HF_INFERENCE_KEY in .env)
pnpm embed:resume

# 3. Commit updated *-embedded.json files and redeploy
git add data/chunks/*-embedded.json
```

Embedded JSON is imported statically in `rag.js` and bundled into the Next.js serverless function at build time.

---

## Request lifecycle (where RAG fits)

```text
1. Housekeeping (cache cleanup, rate-limit eviction)
2. Rate limiting
3. Parse & validate JSON body
4. Security checks (PII, SQL injection, prompt injection)
5. Static cache check          ← exact-match fast path, no RAG
6. RAG context retrieval       ← retrieveContext(userPrompt)
7. LLM call with model fallback ← systemPromptWithContext
8. Stream response
```

---

## Threshold tuning (June 2026 study)

Tested **29 queries** (15 resume, 8 off-topic, 4 skip, 2 static-cache). Full results: `scripts/rag-threshold-report.json`.

| Threshold | Resume recall | Off-topic false positives |
|-----------|---------------|---------------------------|
| 0.35 | 100% | 100% (too permissive) |
| **0.45** | **100%** | **63%** (current) |
| 0.50 | 100% | 50% (max before awards/education miss) |

Off-topic queries with programming overlap (e.g. “learn Python”) may still match weakly — system prompt guardrails handle refusal.

### Token impact (from `[CHATBOT_LOG]`)

| Scenario | Avg prompt tokens |
|----------|-------------------|
| Greeting (RAG skipped) | ~414 |
| Resume query + 3 chunks | ~687 |
| **RAG overhead** | **~+273 prompt tokens** |

Monitor `promptTokens` in production logs after deploy.

---

## Testing & monitoring

```bash
# Threshold sweep + scoring (no dev server required for Phase 1)
node scripts/rag-threshold-study.mjs

# Parse dev-server logs for token stats
node scripts/parse-chat-logs.mjs /path/to/dev-server-terminal-log.txt
```

### Manual smoke tests

1. `"hi"` → `[RAG] Skipped` in logs, ~414 prompt tokens
2. `"What AI projects has Hrishikesh built?"` → 3 chunks injected, scores > 0.45
3. `"How do I bake a cake?"` → no chunks at 0.45 threshold
4. Unset `HF_INFERENCE_KEY` → chat still works, `[RAG] Skipped: missing_token`

---

## Known limitations (future improvements)

Not blockers for calling the pipeline “complete” at portfolio scale, but worth tracking:

- **No vector database** — all 19 chunks loaded in memory; fine at current size
- **No query-embedding cache** — identical questions re-embed via HF
- **Duplicate chunks** across ai/fullstack resumes can occupy 2 of 3 top-K slots
- **HF call on every non-skipped query** — greetings/short queries are short-circuited
- **Re-embed required** when resume JSON changes (not automatic on deploy)
- **Threshold** may need adjustment after live traffic (`scripts/rag-threshold-study.mjs`)

---

## Is this a “complete” RAG pipeline?

**Yes — for this portfolio chatbot**, the end-to-end loop is in place:

1. **Ingestion** — resume → structured chunks  
2. **Indexing** — offline embedding → persisted vectors  
3. **Retrieval** — runtime query embed + similarity search + threshold filter  
4. **Generation** — retrieved context injected into Groq system prompt  

It is a **lightweight, serverless RAG** (pre-computed JSON + in-function search), not an enterprise vector-DB setup. That is appropriate for ~19 chunks and low traffic.
