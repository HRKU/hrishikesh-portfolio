/**
 * logger.js — Serverless-safe structured logger with security detection for the chatbot API.
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

import crypto from 'crypto';

// ─── Utility: Generate unique request IDs ──────────────────────────────────
export function generateRequestId() {
  return crypto.randomBytes(8).toString('hex');
}

// ─── Security Detection Patterns ───────────────────────────────────────────

/**
 * Detect PII (Personal Identifiable Information)
 * Patterns: emails, phone numbers, common personal identifiers
 */
function detectPII(text) {
  if (!text || typeof text !== 'string') return { detected: false };
  const lowerText = text.toLowerCase();

  // Phone pattern — structured formats only; bare \d{10,} removed to avoid
  // false positives on version numbers, timestamps, and similar long digit strings.
  const phonePattern = /(\+?\d{1,3}[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/;
  if (phonePattern.test(text)) {
    return { detected: true, type: 'phone' };
  }
  
  // SSN/ID pattern (XXX-XX-XXXX)
  const ssnPattern = /\d{3}-\d{2}-\d{4}/;
  if (ssnPattern.test(text)) {
    return { detected: true, type: 'ssn' };
  }
  
  // Credit card pattern (basic)
  const ccPattern = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/;
  if (ccPattern.test(text)) {
    return { detected: true, type: 'credit_card' };
  }

  return { detected: false };
}

/**
 * Detect prompt injection attempts
 * Patterns: common injection keywords and techniques
 */
function detectPromptInjection(text) {
  if (!text || typeof text !== 'string') return { detected: false };
  const lowerText = text.toLowerCase();
  
  // Common prompt injection keywords
  const injectionPatterns = [
    /ignore[\s\w]*previous|disregard[\s\w]*instructions|forget[\s\w]*previous/,
    /system\s*prompt|hidden\s*prompt|real\s*instructions/,
    /you\s*are\s*actually|you\s*are\s*now|you\s*will\s*now/,
    /\[SYSTEM\]|\[ADMIN\]|\[OVERRIDE\]|\[JAILBREAK\]/,
    /act\s*as\s*(?!hrishikesh)(?!the|a)/,
    /dalle\s*request|gpt\s*request|api\s*request/,
    /execute\s*code|run\s*code|eval(?:uate)?/,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(lowerText)) {
      return { detected: true, pattern: pattern.source };
    }
  }

  return { detected: false };
}

/**
 * Detect SQL injection attempts
 * Uses multi-token SQL syntax only — avoids blocking normal words like "create" or "RAG".
 */
function detectSQLInjection(text) {
  if (!text || typeof text !== 'string') return { detected: false };
  const lowerText = text.toLowerCase();

  const sqlPatterns = [
    /\bunion\s+(?:all\s+)?select\b/,
    /\bselect\s+[\w*,\s]+\s+from\b/,
    /\binsert\s+into\b/,
    /\bupdate\s+\w+\s+set\b/,
    /\bdelete\s+from\b/,
    /\bdrop\s+(?:table|database|index|schema)\b/,
    /\bcreate\s+(?:table|database|index|procedure|view)\b/,
    /\balter\s+table\b/,
    /['";]\s*(?:or|and)\s+['"\d]/,
    /--\s*(?:union|select|drop)/,
    /;\s*(?:drop|delete|update|insert)\b/,
    /\bxp_\w+|\bsp_\w+/,
  ];

  for (const pattern of sqlPatterns) {
    if (pattern.test(lowerText)) {
      return { detected: true, pattern: pattern.source };
    }
  }

  return { detected: false };
}

/**
 * Run all security checks on user input
 */
export function runSecurityChecks(userPrompt) {
  const checks = {
    pii: detectPII(userPrompt),
    promptInjection: detectPromptInjection(userPrompt),
    sqlInjection: detectSQLInjection(userPrompt),
  };
  
  // Return first detected threat
  for (const [checkType, result] of Object.entries(checks)) {
    if (result.detected) {
      return {
        triggered: true,
        type: checkType,
        reason: `${checkType}: ${result.type || result.pattern || 'suspicious pattern'}`,
      };
    }
  }
  
  return { triggered: false };
}

// ─── In-memory daily usage counter ──────────────────────────────────────────
let dailyUsage = {
  date: new Date().toISOString().slice(0, 10),
  dailyRequests: 0,
  dailyTokens: 0,
  fallbackCount: 0,
  securityTriggeredCount: 0,
};

function resetIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsage.date !== today) {
    dailyUsage = {
      date: today,
      dailyRequests: 0,
      dailyTokens: 0,
      fallbackCount: 0,
      securityTriggeredCount: 0,
    };
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Log a chatbot request/response entry as structured JSON to stdout.
 * Netlify & Vercel capture all stdout in their log viewers.
 * Extended with security and provider information.
 */
export function logRequest({
  requestId,
  ip,
  model,
  promptTokens,
  completionTokens,
  totalTokens,
  latencyMs,
  fallback,
  errorReason,
  providerStatus = 'success',
  providerModel = null,
  cacheHit = false,
  securityTriggered = false,
  securityReason = null,
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    requestId,
    ip,
    model,
    providerModel: providerModel || model,
    providerStatus,
    cacheHit,
    promptTokens,
    completionTokens,
    totalTokens,
    latencyMs,
    fallback: !!fallback,
    errorReason: errorReason || null,
    securityTriggered: !!securityTriggered,
    securityReason: securityReason || null,
  };
  
  // Security logs get a special prefix for easy filtering
  if (securityTriggered) {
    console.error('[SECURITY_ALERT]', JSON.stringify(entry));
  } else {
    console.log('[CHATBOT_LOG]', JSON.stringify(entry));
  }
}

/**
 * Update in-memory daily usage counters.
 * Counters reset automatically at UTC midnight.
 */
export function updateUsage({ totalTokens = 0, fallback = false, securityTriggered = false }) {
  resetIfNewDay();
  dailyUsage.dailyRequests += 1;
  dailyUsage.dailyTokens += totalTokens;
  if (fallback) dailyUsage.fallbackCount += 1;
  if (securityTriggered) dailyUsage.securityTriggeredCount += 1;
}

/**
 * Read the current daily usage snapshot (useful for /api/usage endpoint).
 */
export function getUsage() {
  resetIfNewDay();
  return { ...dailyUsage };
}
