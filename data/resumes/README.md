# Resume Sources & RAG Data Pipeline

Source files for the chatbot knowledge base:

- `ai-resume.tex`
- `fullstack-resume.pdf`

Output chunks and embeddings live in `data/chunks/`.

---

## Full pipeline

```text
resume file  →  chunk  →  embed  →  deploy (commit *-embedded.json)
```

### 1. Chunk resumes

```bash
pnpm chunk:resume -- --input data/resumes/ai-resume.tex --output data/chunks/ai-resume.json --resume-type ai
pnpm chunk:resume -- --input data/resumes/fullstack-resume.pdf --output data/chunks/fullstack-resume.json --resume-type fullstack
```

Produces structured JSON chunks (`id`, `section`, `title`, `text`, etc.) — no vectors yet.

### 2. Embed chunks (offline)

Requires `HF_INFERENCE_KEY` in `.env`:

```bash
pnpm embed:resume
```

Writes:

- `data/chunks/ai-resume-embedded.json`
- `data/chunks/fullstack-resume-embedded.json`

Each chunk gains a `vector` array (384 floats) using `BAAI/bge-small-en-v1.5` (see `config/embedding.js`).

### 3. Deploy

Commit the updated `*-embedded.json` files. Next.js bundles them into the serverless function at build time; runtime search happens in `app/api/chat/utils/rag.js`.

---

## When to re-run

Re-chunk and re-embed whenever resume content changes. Skipping re-embed after chunk edits will desync text from vectors.

---

## More documentation

- [`docs /RAG_PIPELINE.md`](../../docs%20/RAG_PIPELINE.md) — architecture, tuning, testing
- [`CHATBOT_NOTES.md`](../../CHATBOT_NOTES.md) — chatbot status and follow-ups
