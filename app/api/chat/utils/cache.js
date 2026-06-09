const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const cache = new Map();

function normalizeKey(key) {
  return key.trim().toLowerCase();
}

export function getCachedAnswer(prompt) {
  const key = normalizeKey(prompt);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.answer;
}

export function setCachedAnswer(prompt, answer) {
  const key = normalizeKey(prompt);
  cache.set(key, { answer, expires: Date.now() + CACHE_TTL_MS });
}

export function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expires) cache.delete(key);
  }
}
