/**
 * logger.js — Serverless-safe structured logger for the chatbot API.
 *
 * WHY console.log only:
 *   Netlify Functions and Vercel Edge/Node runtimes have READ-ONLY
 *   filesystems. Using fs.writeFileSync / fs.appendFileSync would crash
 *   the function at runtime. Console output is captured by both platforms
 *   in their built-in log viewers (Netlify > Functions > Logs, Vercel > Logs).
 *
 *   If persistent file-based logging is needed, replace the in-memory
 *   approach below with Netlify KV, Upstash Redis, or an external service.
 */

// ─── In-memory daily usage counter ──────────────────────────────────────────
let dailyUsage = {
  date: new Date().toISOString().slice(0, 10),
  dailyRequests: 0,
  dailyTokens: 0,
  fallbackCount: 0,
};

function resetIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsage.date !== today) {
    dailyUsage = {
      date: today,
      dailyRequests: 0,
      dailyTokens: 0,
      fallbackCount: 0,
    };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Log a chatbot request/response entry as structured JSON to stdout.
 * Netlify & Vercel capture all stdout in their log viewers.
 */
export function logRequest({
  ip,
  model,
  promptTokens,
  completionTokens,
  totalTokens,
  latencyMs,
  fallback,
  errorReason,
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    fallback: !!fallback,
    errorReason: errorReason || null,
  };
  // Prefix makes it easy to grep in the Netlify/Vercel log viewer
  console.log('[CHATBOT_LOG]', JSON.stringify(entry));
}

/**
 * Update in-memory daily usage counters.
 * Counters reset automatically at UTC midnight.
 */
export function updateUsage({ totalTokens = 0, fallback = false }) {
  resetIfNewDay();
  dailyUsage.dailyRequests += 1;
  dailyUsage.dailyTokens += totalTokens;
  if (fallback) dailyUsage.fallbackCount += 1;
}

/**
 * Read the current daily usage snapshot (useful for /api/usage endpoint).
 */
export function getUsage() {
  resetIfNewDay();
  return { ...dailyUsage };
}
