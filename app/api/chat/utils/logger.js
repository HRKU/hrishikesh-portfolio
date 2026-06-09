import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'chat.log');
const USAGE_FILE = path.join(LOG_DIR, 'usage.json');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/** Write a JSON line to the chat log */
export function logRequest({ ip, model, promptTokens, completionTokens, totalTokens, latencyMs, fallback, errorReason }) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    fallback,
    errorReason,
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
}

/** Load current usage stats (or initialize) */
function loadUsage() {
  if (fs.existsSync(USAGE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf-8'));
    } catch (_) {
      // corrupted file – reset
    }
  }
  const today = new Date().toISOString().slice(0, 10);
  return { date: today, dailyRequests: 0, dailyTokens: 0, fallbackCount: 0 };
}

/** Save usage stats */
function saveUsage(data) {
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
}

/** Update usage counters */
export function updateUsage({ totalTokens, fallback }) {
  const usage = loadUsage();
  const today = new Date().toISOString().slice(0, 10);
  if (usage.date !== today) {
    // Reset for new day
    usage.date = today;
    usage.dailyRequests = 0;
    usage.dailyTokens = 0;
    usage.fallbackCount = 0;
  }
  usage.dailyRequests += 1;
  usage.dailyTokens += totalTokens || 0;
  if (fallback) usage.fallbackCount += 1;
  saveUsage(usage);
}

/** Retrieve current usage (read‑only) */
export function getUsage() {
  return loadUsage();
}
