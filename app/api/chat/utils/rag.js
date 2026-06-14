// ─── RAG: Runtime Retrieval-Augmented Generation ─────────────────────────────
// Loads pre-computed chunk embeddings and performs cosine similarity matching
// against a user query embedded at runtime via the Hugging Face Inference API.
// ─────────────────────────────────────────────────────────────────────────────

import aiChunks from '../../../../data/chunks/ai-resume-embedded.json';
import fullstackChunks from '../../../../data/chunks/fullstack-resume-embedded.json';

const MODEL = 'BAAI/bge-small-en-v1.5';
const HF_URL = `https://router.huggingface.co/hf-inference/models/${MODEL}/pipeline/feature-extraction`;

// Merge both resume chunk sets into a single searchable pool
const ALL_CHUNKS = [...aiChunks, ...fullstackChunks];

// ─── Math helpers ────────────────────────────────────────────────────────────

function dotProduct(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  return Math.sqrt(sum);
}

function cosineSimilarity(a, b) {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) return 0;
  return dotProduct(a, b) / (magA * magB);
}

// ─── Embed a query string via Hugging Face ───────────────────────────────────

async function embedQuery(query, token) {
  const res = await fetch(HF_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: [query] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[RAG] HF embedding failed (HTTP ${res.status}): ${errText}`);
    return null;
  }

  const vectors = await res.json();
  // HF returns [[...384 floats]] for a single-item batch
  return Array.isArray(vectors?.[0]) ? vectors[0] : null;
}

// ─── Retrieve top-K relevant chunks ──────────────────────────────────────────

const DEFAULT_TOP_K = 3;
const SIMILARITY_THRESHOLD = 0.35;

/**
 * Retrieve the most relevant resume chunks for a given user query.
 *
 * @param {string} query - The user's question
 * @param {object} [options]
 * @param {number} [options.topK=3] - Maximum number of chunks to return
 * @param {number} [options.threshold=0.35] - Minimum cosine similarity score
 * @returns {Promise<{ context: string, chunks: Array, error: string|null }>}
 */
export async function retrieveContext(query, options = {}) {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const threshold = options.threshold ?? SIMILARITY_THRESHOLD;
  const token = process.env.HF_INFERENCE_KEY;

  if (!token) {
    console.warn('[RAG] HF_INFERENCE_KEY not set — skipping retrieval.');
    return { context: '', chunks: [], error: 'missing_token' };
  }

  try {
    const queryVector = await embedQuery(query, token);
    if (!queryVector) {
      return { context: '', chunks: [], error: 'embedding_failed' };
    }

    // Score every chunk against the query
    const scored = ALL_CHUNKS
      .map(chunk => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.vector),
      }))
      .filter(c => c.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    if (scored.length === 0) {
      return { context: '', chunks: [], error: null };
    }

    // Build a readable context block for prompt injection
    const context = scored
      .map((c, i) => `[${i + 1}] (${c.section} — ${c.title}): ${c.text}`)
      .join('\n');

    // Strip vectors from returned chunks to avoid bloating logs
    const chunks = scored.map(({ vector, ...rest }) => rest);

    return { context, chunks, error: null };
  } catch (err) {
    console.error('[RAG] Retrieval error:', err.message);
    return { context: '', chunks: [], error: err.message };
  }
}
