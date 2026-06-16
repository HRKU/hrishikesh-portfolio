#!/usr/bin/env node
/** Parse dev server log for CHATBOT_REQUEST + CHATBOT_LOG + RAG correlation */

import fs from 'node:fs';
import path from 'node:path';

const LOG_PATH = process.argv[2];
if (!LOG_PATH || !fs.existsSync(LOG_PATH)) {
  console.error('Usage: node scripts/parse-chat-logs.mjs <terminal-log.txt>');
  process.exit(1);
}

const lines = fs.readFileSync(LOG_PATH, 'utf8').split('\n');
const sessions = [];
let current = null;

for (const line of lines) {
  const reqIdx = line.indexOf('[CHATBOT REQUEST]');
  if (reqIdx !== -1) {
    try {
      current = { request: JSON.parse(line.slice(reqIdx + 17).trim()), rag: null, log: null };
      sessions.push(current);
    } catch { current = null; }
    continue;
  }
  if (!current) continue;
  const ragIdx = line.indexOf('[RAG]');
  if (ragIdx !== -1) {
    current.rag = line.slice(ragIdx + 5).trim();
    continue;
  }
  const logIdx = line.indexOf('[CHATBOT_LOG]');
  if (logIdx !== -1) {
    try {
      current.log = JSON.parse(line.slice(logIdx + 13).trim());
    } catch { /* */ }
  }
}

const success = sessions.filter(s => s.log?.providerStatus === 'success' && s.log.totalTokens > 0);
const rateLimited = sessions.filter(s => s.log?.errorReason === 'Rate limit exceeded');
const withRag = sessions.filter(s => s.rag?.startsWith('Injected'));
const skippedRag = sessions.filter(s => s.rag?.startsWith('Skipped'));
const noRag = sessions.filter(s => !s.rag);

const avg = (arr, key) => {
  const v = arr.map(x => x.log?.[key]).filter(Boolean);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
};

console.log('=== Chat Log Analysis ===');
console.log(`Total requests: ${sessions.length}`);
console.log(`Successful LLM: ${success.length}`);
console.log(`Rate limited: ${rateLimited.length}`);
console.log(`RAG injected: ${withRag.length}`);
console.log(`RAG skipped: ${skippedRag.length}`);

if (success.length) {
  console.log('\n--- Token averages (successful) ---');
  console.log(`Prompt tokens: ${avg(success, 'promptTokens')} (min ${Math.min(...success.map(s => s.log.promptTokens))}, max ${Math.max(...success.map(s => s.log.promptTokens))})`);
  console.log(`Completion tokens: ${avg(success, 'completionTokens')}`);
  console.log(`Total tokens: ${avg(success, 'totalTokens')}`);
  console.log(`Latency ms: ${avg(success, 'latencyMs')}`);
}

const withRagSuccess = success.filter(s => s.rag?.startsWith('Injected'));
const noRagSuccess = success.filter(s => !s.rag?.startsWith('Injected'));

if (withRagSuccess.length && noRagSuccess.length) {
  console.log('\n--- RAG vs no-RAG ---');
  console.log(`With RAG prompt avg: ${avg(withRagSuccess, 'promptTokens')} (n=${withRagSuccess.length})`);
  console.log(`No RAG prompt avg: ${avg(noRagSuccess, 'promptTokens')} (n=${noRagSuccess.length})`);
  console.log(`RAG overhead ~${avg(withRagSuccess, 'promptTokens') - avg(noRagSuccess, 'promptTokens')} prompt tokens`);
}

console.log('\n--- Per request ---');
for (const s of sessions) {
  const q = s.request?.lastMessage?.slice(0, 55) ?? '?';
  const pt = s.log?.promptTokens ?? '-';
  const tt = s.log?.totalTokens ?? '-';
  const st = s.log?.providerStatus ?? 'no-log';
  const rag = s.rag ? s.rag.slice(0, 45) : '—';
  console.log(`${pt}/${tt} [${st}] ${rag} | ${q}`);
}

const outPath = path.join(process.cwd(), 'scripts', 'rag-threshold-report.json');
if (fs.existsSync(outPath)) {
  const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  report.liveLogAnalysis = {
    parsedAt: new Date().toISOString(),
    logPath: LOG_PATH,
    totalRequests: sessions.length,
    successfulLlm: success.length,
    rateLimited: rateLimited.length,
    avgPromptTokensWithRag: avg(withRagSuccess, 'promptTokens'),
    avgPromptTokensNoRag: avg(noRagSuccess, 'promptTokens'),
    avgTotalTokensWithRag: avg(withRagSuccess, 'totalTokens'),
    sessions: sessions.map(s => ({
      query: s.request?.lastMessage,
      rag: s.rag,
      promptTokens: s.log?.promptTokens ?? null,
      completionTokens: s.log?.completionTokens ?? null,
      totalTokens: s.log?.totalTokens ?? null,
      latencyMs: s.log?.latencyMs ?? null,
      providerStatus: s.log?.providerStatus ?? null,
      errorReason: s.log?.errorReason ?? null,
    })),
  };
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`\nUpdated ${outPath}`);
}
