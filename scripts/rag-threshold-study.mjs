#!/usr/bin/env node
/**
 * RAG threshold + token usage study — run: node scripts/rag-threshold-study.mjs
 * Requires: .env with HF_INFERENCE_KEY; dev server on :3000 for token tests.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  HF_EMBEDDING_URL,
  HF_FETCH_TIMEOUT_MS,
  MIN_RAG_QUERY_WORDS,
  RAG_GREETING_PATTERN,
} from '../config/embedding.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'chunks');
const ALL_CHUNKS = [
  ...JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'ai-resume-embedded.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'fullstack-resume-embedded.json'), 'utf8')),
];

const THRESHOLDS = [0.30, 0.35, 0.40, 0.45, 0.50];
const TOP_K = 3;
const API_BASE = process.env.RAG_TEST_API_BASE ?? 'http://localhost:3000';
const LOG_PATH = process.env.RAG_TEST_LOG_PATH ?? '';

const TEST_QUERIES = [
  // Resume-specific (expect relevant matches)
  { query: 'What AI projects has Hrishikesh built?', category: 'resume' },
  { query: 'Tell me about the Run2Feed marathon platform', category: 'resume' },
  { query: 'What is Hrishikesh experience at Candent Technologies?', category: 'resume' },
  { query: 'What technologies does Hrishikesh use?', category: 'resume' },
  { query: 'Describe the multi-agent AI chatbot project', category: 'resume' },
  { query: 'What DevOps and cloud skills does Hrishikesh have?', category: 'resume' },
  { query: 'Tell me about the ticketing system web app', category: 'resume' },
  { query: 'What awards has Hrishikesh received?', category: 'resume' },
  { query: 'Where did Hrishikesh study and what degree?', category: 'resume' },
  { query: 'Explain the RAG pipeline Hrishikesh architected', category: 'resume' },
  { query: 'What fintech modules did Hrishikesh deliver?', category: 'resume' },
  { query: 'What is Hrishikesh GenAI and LLM experience?', category: 'resume' },
  { query: 'Does Hrishikesh know Docker and CI/CD?', category: 'resume' },
  { query: 'What databases has Hrishikesh worked with?', category: 'resume' },
  { query: 'Tell me about the AI Scrum assistant using Ollama', category: 'resume' },

  // Off-topic (expect no / weak matches)
  { query: 'How do I bake a chocolate cake from scratch?', category: 'off-topic' },
  { query: 'What is the capital of France?', category: 'off-topic' },
  { query: 'Who won the FIFA World Cup in 2022?', category: 'off-topic' },
  { query: 'How do I learn Python programming as a beginner?', category: 'off-topic' },
  { query: 'What is the weather like in Tokyo today?', category: 'off-topic' },
  { query: 'Tell me a joke about programming cats', category: 'off-topic' },
  { query: 'How do I fix a flat tire on my car?', category: 'off-topic' },
  { query: 'What are the best stocks to buy in 2026?', category: 'off-topic' },

  // Skipped (greeting / short)
  { query: 'hi', category: 'skip' },
  { query: 'hello', category: 'skip' },
  { query: 'thanks', category: 'skip' },
  { query: 'good morning', category: 'skip' },

  // Static cache (no RAG, no LLM tokens from Groq path — baseline only)
  { query: 'who is hrishikesh?', category: 'static-cache' },
  { query: 'tell me about run2feed', category: 'static-cache' },
];

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = (match[2] || '').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function shouldSkipRag(query) {
  const trimmed = query.trim();
  if (!trimmed) return true;
  if (trimmed.split(/\s+/).length < MIN_RAG_QUERY_WORDS) return true;
  if (RAG_GREETING_PATTERN.test(trimmed)) return true;
  return false;
}

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

async function embedQuery(query, token, retries = 2, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HF_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(HF_EMBEDDING_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: [query] }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.status === 503) {
        const payload = await res.json().catch(() => ({}));
        const waitTime = payload.estimated_time ? Math.ceil(payload.estimated_time) * 1000 : delayMs;
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      if (!res.ok) {
        if (i === retries - 1) throw new Error(`HF HTTP ${res.status}`);
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      const vectors = await res.json();
      return Array.isArray(vectors?.[0]) ? vectors[0] : null;
    } catch (err) {
      clearTimeout(timeoutId);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return null;
}

function scoreQuery(queryVector, threshold) {
  return ALL_CHUNKS
    .map(chunk => ({
      title: chunk.title,
      section: chunk.section,
      score: cosineSimilarity(queryVector, chunk.vector),
    }))
    .filter(c => c.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);
}

function estContextTokens(context) {
  // Rough ~4 chars per token for English prose
  return context ? Math.ceil(context.length / 4) : 0;
}

function buildContext(matches) {
  if (!matches.length) return '';
  return matches
    .map((c, i) => `[${i + 1}] (${c.section} — ${c.title}): ${ALL_CHUNKS.find(x => x.title === c.title && x.section === c.section)?.text ?? ''}`)
    .join('\n');
}

function readChatbotLogs(logPath) {
  if (!logPath || !fs.existsSync(logPath)) return [];
  const content = fs.readFileSync(logPath, 'utf8');
  const entries = [];
  for (const line of content.split('\n')) {
    const idx = line.indexOf('[CHATBOT_LOG]');
    if (idx === -1) continue;
    try {
      entries.push(JSON.parse(line.slice(idx + '[CHATBOT_LOG]'.length).trim()));
    } catch { /* skip */ }
  }
  return entries;
}

async function chatRequest(query) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: query }] }),
  });
  if (!res.ok) throw new Error(`Chat API HTTP ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) return '';
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += new TextDecoder().decode(value);
  }
  return text;
}

function analyzeThresholds(results) {
  const scored = results.filter(r => r.category !== 'skip' && r.category !== 'static-cache' && r.topScore !== null);
  const summary = {};

  for (const t of THRESHOLDS) {
    let resumeHit = 0;
    let resumeTotal = 0;
    let offTopicHit = 0;
    let offTopicTotal = 0;

    for (const r of scored) {
      const matches = r.matchesByThreshold[t];
      if (r.category === 'resume') {
        resumeTotal++;
        if (matches.length > 0) resumeHit++;
      } else if (r.category === 'off-topic') {
        offTopicTotal++;
        if (matches.length > 0) offTopicHit++;
      }
    }

    summary[t] = {
      resumeRecall: resumeTotal ? (resumeHit / resumeTotal) : 0,
      offTopicFalsePositiveRate: offTopicTotal ? (offTopicHit / offTopicTotal) : 0,
      resumeHit,
      resumeTotal,
      offTopicHit,
      offTopicTotal,
    };
  }

  return summary;
}

function recommendThreshold(summary) {
  // Prefer highest threshold with 100% resume recall and lowest off-topic FP rate
  const candidates = THRESHOLDS.filter(t => summary[t].resumeRecall >= 1.0);
  if (!candidates.length) {
    return { threshold: 0.35, reason: 'No threshold achieved 100% resume recall; keeping 0.35' };
  }
  const best = candidates.reduce((a, b) =>
    summary[a].offTopicFalsePositiveRate <= summary[b].offTopicFalsePositiveRate ? a : b
  );
  const fp = (summary[best].offTopicFalsePositiveRate * 100).toFixed(0);
  return {
    threshold: best,
    reason: `100% resume recall with ${fp}% off-topic false-positive rate (lowest among qualifying thresholds)`,
  };
}

async function main() {
  loadEnv();
  const token = process.env.HF_INFERENCE_KEY;
  if (!token) {
    console.error('HF_INFERENCE_KEY required');
    process.exit(1);
  }

  const logStartCount = readChatbotLogs(LOG_PATH).length;

  console.log('=== RAG Threshold & Token Study ===');
  console.log(`Queries: ${TEST_QUERIES.length} | Chunks: ${ALL_CHUNKS.length}`);
  console.log(`API: ${API_BASE} | Log: ${LOG_PATH || '(not set)'}\n`);

  const results = [];

  // Phase 1: embed + score all queries
  console.log('Phase 1: Embedding and scoring...\n');
  for (const { query, category } of TEST_QUERIES) {
    const row = { query, category, skipped: shouldSkipRag(query), topScore: null, topTitle: null, matchesByThreshold: {} };

    if (row.skipped || category === 'static-cache') {
      for (const t of THRESHOLDS) row.matchesByThreshold[t] = [];
      results.push(row);
      console.log(`  [${category}] "${query}" → ${category === 'static-cache' ? 'static cache' : 'RAG skipped'}`);
      continue;
    }

    process.stdout.write(`  [${category}] "${query.slice(0, 50)}..." `);
    const vec = await embedQuery(query, token);
    if (!vec) {
      console.log('EMBED FAILED');
      results.push(row);
      continue;
    }

    const allScored = ALL_CHUNKS
      .map(c => ({ title: c.title, section: c.section, score: cosineSimilarity(vec, c.vector) }))
      .sort((a, b) => b.score - a.score);

    row.topScore = allScored[0]?.score ?? null;
    row.topTitle = allScored[0]?.title ?? null;

    for (const t of THRESHOLDS) {
      row.matchesByThreshold[t] = scoreQuery(vec, t);
    }

    const at35 = row.matchesByThreshold[0.35];
    console.log(`top=${row.topScore?.toFixed(3)} @0.35=${at35.length}ch [${at35.map(m => m.score.toFixed(2)).join(', ')}]`);
    results.push(row);

    await new Promise(r => setTimeout(r, 150));
  }

  // Phase 2: live API token measurement
  console.log('\nPhase 2: Live chat API token measurement...\n');
  const apiQueries = TEST_QUERIES.filter(q => q.category !== 'static-cache');
  for (const { query, category } of apiQueries) {
    process.stdout.write(`  POST "${query.slice(0, 45)}..." `);
    try {
      await chatRequest(query);
      console.log('ok');
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // Parse new log entries
  const allLogs = readChatbotLogs(LOG_PATH);
  const newLogs = allLogs.slice(logStartCount);
  const tokenRows = newLogs.filter(l => l.providerStatus === 'success' && l.totalTokens > 0);

  // Match logs to queries by order (requests are sequential)
  const apiResults = [];
  let logIdx = 0;
  for (const { query, category } of apiQueries) {
    const entry = tokenRows[logIdx];
    if (entry) {
      apiResults.push({
        query,
        category,
        promptTokens: entry.promptTokens,
        completionTokens: entry.completionTokens,
        totalTokens: entry.totalTokens,
        latencyMs: entry.latencyMs,
        cacheHit: entry.cacheHit,
      });
      logIdx++;
    }
  }

  const thresholdSummary = analyzeThresholds(results);
  const recommendation = recommendThreshold(thresholdSummary);

  // Token stats
  const withRag = apiResults.filter(r => r.category === 'resume' || r.category === 'off-topic');
  const skipped = apiResults.filter(r => r.category === 'skip');
  const avg = arr => arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0;

  const avgPromptResume = avg(withRag.filter(r => r.category === 'resume').map(r => r.promptTokens));
  const avgPromptOffTopic = avg(withRag.filter(r => r.category === 'off-topic').map(r => r.promptTokens));
  const avgPromptSkip = avg(skipped.map(r => r.promptTokens));
  const avgTotalResume = avg(withRag.filter(r => r.category === 'resume').map(r => r.totalTokens));
  const avgTotalSkip = avg(skipped.map(r => r.totalTokens));

  const report = {
    generatedAt: new Date().toISOString(),
    queryCount: TEST_QUERIES.length,
    thresholdSummary,
    recommendation,
    tokenStats: {
      avgPromptTokens: {
        resumeWithRag: Math.round(avgPromptResume),
        offTopicWithRag: Math.round(avgPromptOffTopic),
        greetingNoRag: Math.round(avgPromptSkip),
        ragOverheadEstimate: Math.round(avgPromptResume - avgPromptSkip),
      },
      avgTotalTokens: {
        resumeWithRag: Math.round(avgTotalResume),
        greetingNoRag: Math.round(avgTotalSkip),
      },
      perQuery: apiResults,
    },
    scoringDetails: results.map(r => ({
      query: r.query,
      category: r.category,
      skipped: r.skipped,
      topScore: r.topScore,
      topTitle: r.topTitle,
      at035: r.matchesByThreshold[0.35]?.map(m => ({ title: m.title, score: +m.score.toFixed(3) })),
      at045: r.matchesByThreshold[0.45]?.map(m => ({ title: m.title, score: +m.score.toFixed(3) })),
      estContextTokensAt035: estContextTokens(buildContext(r.matchesByThreshold[0.35] ?? [])),
    })),
  };

  const outPath = path.join(process.cwd(), 'scripts', 'rag-threshold-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  // Console report
  console.log('\n=== Threshold Analysis ===\n');
  console.log('Threshold | Resume Recall | Off-topic FP Rate');
  console.log('----------|---------------|------------------');
  for (const t of THRESHOLDS) {
    const s = thresholdSummary[t];
    console.log(
      `   ${t.toFixed(2)}   | ${(s.resumeRecall * 100).toFixed(0)}% (${s.resumeHit}/${s.resumeTotal})     | ${(s.offTopicFalsePositiveRate * 100).toFixed(0)}% (${s.offTopicHit}/${s.offTopicTotal})`
    );
  }

  console.log(`\nRecommendation: threshold ${recommendation.threshold}`);
  console.log(`Reason: ${recommendation.reason}`);

  console.log('\n=== Token Usage (from CHATBOT_LOG) ===\n');
  console.log(`Avg prompt tokens — resume + RAG: ${report.tokenStats.avgPromptTokens.resumeWithRag}`);
  console.log(`Avg prompt tokens — off-topic + RAG: ${report.tokenStats.avgPromptTokens.offTopicWithRag}`);
  console.log(`Avg prompt tokens — greeting (no RAG): ${report.tokenStats.avgPromptTokens.greetingNoRag}`);
  console.log(`Estimated RAG context overhead: ~${report.tokenStats.avgPromptTokens.ragOverheadEstimate} prompt tokens`);
  console.log(`Avg total tokens — resume: ${report.tokenStats.avgTotalTokens.resumeWithRag}`);
  console.log(`Avg total tokens — greeting: ${report.tokenStats.avgTotalTokens.greetingNoRag}`);

  if (apiResults.length === 0) {
    console.log('\n⚠ No CHATBOT_LOG entries captured. Set RAG_TEST_LOG_PATH to dev server terminal file.');
  }

  console.log(`\nFull report: ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
