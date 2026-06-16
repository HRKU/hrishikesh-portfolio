# Chatbot Notes

Last updated: June 2026

---

## Current status

The portfolio chatbot has a **working RAG pipeline** for resume-grounded answers. See [`docs /RAG_PIPELINE.md`](docs%20/RAG_PIPELINE.md) for architecture, config, and ops.

| Layer | Status |
|-------|--------|
| Chunking (`pnpm chunk:resume`) | Done |
| Offline embedding (`pnpm embed:resume`) | Done |
| Runtime retrieval (`app/api/chat/utils/rag.js`) | Done |
| Prompt injection in `/api/chat` | Done |
| Greeting / short-query skip | Done |
| HF retry + 3s timeout | Done |
| Similarity threshold tuned (0.45) | Done |
| Non-fatal fallback (missing HF key / HF down) | Done |

**Token impact:** RAG adds ~273 prompt tokens when 3 chunks inject (~414 base → ~687 with context). Monitor via `[CHATBOT_LOG]` → `promptTokens`.

---

## Request flow (summary)

```text
User message → rate limit → security → static cache?
  → RAG (skip greetings / embed query / top-3 chunks)
  → Groq LLM with augmented system prompt → stream
```

Static cache hits (e.g. `"who is hrishikesh?"`) bypass RAG and Groq.

---

## Environment variables

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | LLM (required) |
| `HF_INFERENCE_KEY` | Runtime query embedding (optional — RAG skipped if missing) |

Set both in Netlify Environment Variables for full RAG in production.

---

## Remaining quality issues (not RAG blockers)

Captured issues to revisit:

- The bot can sound confident without verifying facts.
- Personal details such as hobbies should only be confirmed if they exist in verified resume or profile data.
- User-provided claims should not be echoed back as facts unless the bot can confirm them from source data.
- The assistant should answer directly when asked for constructive critique, but keep the answer grounded in evidence.
- The prompt needs a stronger rule to separate verified facts, inferred statements, and unknowns.

### Planned follow-up (post-RAG)

- [ ] Stricter response policy for personal-life questions.
- [ ] Explicit fallback: “I can't confirm that from the available information” when data is missing.
- [ ] Dedup identical chunks across ai/fullstack resumes in top-K — partially addressed via title dedup in heuristic re-rank
- [ ] Optional query-embedding cache (TTL) to reduce HF calls.
- [ ] Re-run threshold study after live traffic (`node scripts/rag-threshold-study.mjs`).

### Completed

- [x] Source-grounded retrieval for resume and project data (RAG pipeline)
- [x] Heuristic re-rank (tag overlap, title boost, MMR, title dedup)
