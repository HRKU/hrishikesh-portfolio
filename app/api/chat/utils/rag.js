// ─── RAG: Runtime Retrieval-Augmented Generation ─────────────────────────────
// Loads pre-computed chunk embeddings and performs cosine similarity matching
// against a user query embedded at runtime via the Hugging Face Inference API.
// ─────────────────────────────────────────────────────────────────────────────

import aiChunks from '../../../../data/chunks/ai-resume-embedded.json';
import fullstackChunks from '../../../../data/chunks/fullstack-resume-embedded.json';
import {
  HF_EMBEDDING_URL,
  HF_FETCH_TIMEOUT_MS,
  MIN_RAG_QUERY_WORDS,
  RAG_GREETING_PATTERN,
} from '../../../../config/embedding.js';

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

function shouldSkipRag(query) {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount < MIN_RAG_QUERY_WORDS) return true;
  if (RAG_GREETING_PATTERN.test(trimmed)) return true;

  return false;
}

// ─── Embed a query string via Hugging Face ───────────────────────────────────

async function embedQuery(query, token, retries = 2, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HF_FETCH_TIMEOUT_MS);

    try {
      const res = await fetch(HF_EMBEDDING_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: [query] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 503) {
        const payload = await res.json().catch(() => ({}));
        const waitTime = payload.estimated_time ? Math.ceil(payload.estimated_time) * 1000 : delayMs;
        console.warn(`[RAG] Model loading. Waiting ${waitTime / 1000}s before retry ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[RAG] HF embedding failed (HTTP ${res.status}): ${errText}`);
        if (i === retries - 1) return null;
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }

      const vectors = await res.json();
      // HF returns [[...384 floats]] for a single-item batch
      return Array.isArray(vectors?.[0]) ? vectors[0] : null;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error(`[RAG] HF embedding timed out after ${HF_FETCH_TIMEOUT_MS}ms`);
      } else {
        console.error(`[RAG] HF embedding failed: ${err.message}`);
      }
      if (i === retries - 1) return null;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

// ─── Heuristic re-rank (stage 2) ─────────────────────────────────────────────
// Rule-based rescoring of bi-encoder candidates — no extra ML model or API call.
// Combines cosine similarity with tag overlap, title matching, title dedup, and MMR.

const CANDIDATE_POOL_SIZE = 8;
const MMR_LAMBDA = 0.7;
const BI_SCORE_WEIGHT = 0.65;
const TAG_OVERLAP_WEIGHT = 0.25;
const TITLE_MATCH_BOOST = 0.15;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was',
  'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new',
  'now', 'old', 'see', 'two', 'way', 'who', 'did', 'let', 'say', 'she', 'too', 'use',
  'what', 'when', 'where', 'which', 'with', 'have', 'from', 'they', 'been', 'than',
  'that', 'this', 'will', 'your', 'about', 'tell', 'does', 'know', 'like', 'make',
  'into', 'over', 'such', 'take', 'them', 'well', 'were', 'would', 'there', 'their',
  'hrishikesh', 'please', 'just', 'also', 'more', 'some', 'any', 'give', 'show',
]);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/** Fraction of query tokens that match chunk tags, title, or section */
function tagOverlapScore(queryTokens, chunk) {
  if (queryTokens.length === 0) return 0;

  const searchable = new Set([
    ...(chunk.tags ?? []).map(t => t.toLowerCase()),
    ...tokenize(chunk.title),
    ...tokenize(chunk.section ?? ''),
  ]);

  let matches = 0;
  for (const token of queryTokens) {
    if (searchable.has(token)) {
      matches++;
      continue;
    }
    for (const term of searchable) {
      if (term.includes(token) || token.includes(term)) {
        matches++;
        break;
      }
    }
  }

  return matches / queryTokens.length;
}

/** Extra boost when distinctive title words appear verbatim in the query */
function titleMatchBoost(queryLower, chunk) {
  const titleTokens = tokenize(chunk.title).filter(w => w.length > 4);
  for (const token of titleTokens) {
    if (queryLower.includes(token)) return TITLE_MATCH_BOOST;
  }
  return 0;
}

function computeHeuristicScore(biScore, queryTokens, queryLower, chunk) {
  const tagScore = tagOverlapScore(queryTokens, chunk);
  const titleBoost = titleMatchBoost(queryLower, chunk);
  return biScore * BI_SCORE_WEIGHT + tagScore * TAG_OVERLAP_WEIGHT + titleBoost;
}

/**
 * Pick top-K chunks using MMR for diversity and skip duplicate titles
 * (e.g. Run2Feed appearing in both ai-resume and fullstack-resume).
 */
function selectWithHeuristicRerank(candidates, topK) {
  const pool = candidates
    .map(c => ({ ...c, rerankScore: c.rerankScore ?? c.biScore }))
    .sort((a, b) => b.rerankScore - a.rerankScore);

  const selected = [];
  const selectedTitles = new Set();

  while (selected.length < topK && pool.length > 0) {
    let bestIdx = -1;
    let bestMmr = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      if (selectedTitles.has(candidate.title)) continue;

      let maxSimToSelected = 0;
      for (const picked of selected) {
        maxSimToSelected = Math.max(
          maxSimToSelected,
          cosineSimilarity(candidate.vector, picked.vector),
        );
      }

      const mmr =
        MMR_LAMBDA * candidate.rerankScore - (1 - MMR_LAMBDA) * maxSimToSelected;

      if (mmr > bestMmr) {
        bestMmr = mmr;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) break;

    const [picked] = pool.splice(bestIdx, 1);
    selectedTitles.add(picked.title);
    selected.push(picked);
  }

  return selected;
}

// ─── Retrieve top-K relevant chunks ──────────────────────────────────────────

const DEFAULT_TOP_K = 3;
/** Min cosine similarity — tuned via scripts/rag-threshold-study.mjs (29 queries, Jun 2026) */
const SIMILARITY_THRESHOLD = 0.45;

/**
 * Retrieve the most relevant resume chunks for a given user query.
 *
 * @param {string} query - The user's question
 * @param {object} [options]
 * @param {number} [options.topK=3] - Maximum number of chunks to return
 * @param {number} [options.threshold=0.45] - Minimum cosine similarity score
 * @returns {Promise<{ context: string, chunks: Array, error: string|null }>}
 */
export async function retrieveContext(query, options = {}) {
  const topK = options.topK ?? DEFAULT_TOP_K;
  const threshold = options.threshold ?? SIMILARITY_THRESHOLD;
  const token = process.env.HF_INFERENCE_KEY;

  if (shouldSkipRag(query)) {
    console.log('[RAG] Skipped: query too short or greeting');
    return { context: '', chunks: [], error: null };
  }

  if (!token) {
    console.warn('[RAG] HF_INFERENCE_KEY not set — skipping retrieval.');
    return { context: '', chunks: [], error: 'missing_token' };
  }

  try {
    const queryVector = await embedQuery(query, token);
    if (!queryVector) {
      return { context: '', chunks: [], error: 'embedding_failed' };
    }

    const queryLower = query.toLowerCase();
    const queryTokens = tokenize(query);

    // Stage 1: bi-encoder retrieval — cosine similarity, filter, widen candidate pool
    const candidates = ALL_CHUNKS
      .map(chunk => ({
        ...chunk,
        biScore: cosineSimilarity(queryVector, chunk.vector),
      }))
      .filter(c => c.biScore >= threshold)
      .sort((a, b) => b.biScore - a.biScore)
      .slice(0, CANDIDATE_POOL_SIZE)
      .map(c => ({
        ...c,
        rerankScore: computeHeuristicScore(c.biScore, queryTokens, queryLower, c),
      }));

    if (candidates.length === 0) {
      return { context: '', chunks: [], error: null };
    }

    // Stage 2: heuristic re-rank — tag/title signals + MMR diversity + title dedup
    const scored = selectWithHeuristicRerank(candidates, topK).map(c => ({
      ...c,
      score: c.rerankScore,
    }));

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
