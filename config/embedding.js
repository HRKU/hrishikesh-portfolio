/** Shared embedding model config — used by scripts/embed-chunks.mjs and app/api/chat/utils/rag.js */

export const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';

export const HF_EMBEDDING_URL =
  `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`;

/** Max wait per HF fetch attempt (runtime RAG) */
export const HF_FETCH_TIMEOUT_MS = 3000;

/** Skip RAG when the query has fewer words than this */
export const MIN_RAG_QUERY_WORDS = 3;

/** Whole-query match for common greetings (case-insensitive) */
export const RAG_GREETING_PATTERN =
  /^(?:hi|hello|hey|howdy|yo|sup|what'?s\s+up|good\s+(?:morning|afternoon|evening))[\s!.?]*$/i;
