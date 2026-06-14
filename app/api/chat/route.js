import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { logRequest, generateRequestId, runSecurityChecks, updateUsage } from './utils/logger';
import { getChatCompletionStream } from './utils/modelSelector';
import { getCachedAnswer, setCachedAnswer, cleanCache } from './utils/cache';

// ─── Module-level singletons (avoid re-creating on every request) ─────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Fallback model order — primary first, cheapest/fastest last
const MODEL_ORDER = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'qwen/qwen3-32b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
];

// Static cache answers — built once, not per request
const STATIC_ANSWERS = {
  'who is hrishikesh?':
    'Hrishikesh Upadhyaya is a Full Stack & AI Developer based in Pune, India, specialising in Next.js, AI agents, and cloud architectures.',
  'tell me about run2feed':
    'Run2Feed is a marathon platform built with Next.js, Docker, and Easebuzz payment integration, enabling seamless race registrations and results.',
  'what technologies do you use?':
    'The stack includes JavaScript/TypeScript, Next.js, React, Node.js, Express, MongoDB, SQL, Azure OpenAI, AutoGen, RAG pipelines, Docker, and CI/CD.',
  'show your projects':
    'Key projects: Run2Feed Marathon Platform, Ticketing System, AI Chatbot with multi‑agent architecture, and several fintech modules.',
};

const SYSTEM_PROMPT = `
You are the digital twin of Hrishikesh Upadhyaya, an expert Full Stack & AI Developer based in Pune, India.
Your tone is confident, extremely technical, concise, and professional.
You are answering questions on his portfolio website.

Core Tech Stack: JavaScript, TypeScript, Python, Next.js, React, Node.js, Express, MongoDB, SQL.
AI & GenAI: Multi-agent Systems (AutoGen), Azure OpenAI, RAG Pipelines, Vector Search, LLM Tool-calling, Ollama.
DevOps: Azure, Docker, CI/CD, VPS Deployment.

Experience:
- Full Stack Developer at Candent Technologies (Mar 2023 - Present): Built a multi-agent AI chatbot using AutoGen and Azure OpenAI for cybersecurity. Architected RAG pipelines. Built an AI Scrum assistant using Ollama. Delivered 13+ fintech modules in Next.js.

Projects:
- Run2Feed Marathon Platform: Next.js, Docker, Easebuzz payment.
- Ticketing System: React, TypeScript, Node.js, MongoDB.

CRITICAL GUARDRAILS:
1. ONLY answer questions related to Hrishikesh, his professional experience, his tech stack, or his projects.
2. DO NOT write code for the user, generate arbitrary React components, or solve coding problems. If asked to write code, politely decline and explain that you are here to discuss Hrishikesh's architecture and systems, not to be a general coding assistant.
3. If asked an unrelated general query (e.g., "How do I bake a cake?", "What is the capital of France?"), do NOT answer it directly. Instead, refuse humorously and tie it back to Hrishikesh. (Example: "I don't know how to bake a cake, but I do know that Hrishikesh cooks up incredibly fast Next.js applications!").

Keep your answers short (1-3 sentences) unless asked for details.
`;

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  'X-Content-Type-Options': 'nosniff',
};

// ─── In-memory rate limiter ────────────────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const TIME_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip, now) {
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.startTime > TIME_WINDOW_MS) {
    // First request or window expired — reset
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return false; // not rate-limited
  }
  if (entry.count >= RATE_LIMIT) return true; // rate-limited
  entry.count += 1;
  return false;
}

// Periodically evict stale rate-limit entries to prevent memory leak
// (runs on each request, O(n) over IPs — safe for a portfolio with low traffic)
function evictStaleRateLimitEntries(now) {
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.startTime > TIME_WINDOW_MS) rateLimitMap.delete(ip);
  }
}

function createTextStreamResponse(text) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}

function createGroqStreamResponse({
  stream,
  requestId,
  ip,
  modelUsed,
  fallback,
  providerStatus,
  startTime,
}) {
  const encoder = new TextEncoder();
  let usage = null;

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const token = chunk?.choices?.[0]?.delta?.content ?? '';
          if (token) {
            controller.enqueue(encoder.encode(token));
          }

          if (chunk?.x_groq?.usage) {
            usage = chunk.x_groq.usage;
          }
        }

        const latencyMs = Date.now() - startTime;
        logRequest({
          requestId,
          ip,
          model: modelUsed,
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
          latencyMs,
          fallback,
          errorReason: null,
          providerStatus: providerStatus || 'success',
          providerModel: modelUsed,
          cacheHit: false,
          securityTriggered: false,
          securityReason: null,
        });
        updateUsage({ totalTokens: usage?.total_tokens ?? 0, fallback });
        controller.close();
      } catch (error) {
        const latencyMs = Date.now() - startTime;
        logRequest({
          requestId,
          ip,
          model: modelUsed || 'unknown',
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs,
          fallback: false,
          errorReason: error.message,
          providerStatus: 'error',
          providerModel: modelUsed || null,
          cacheHit: false,
          securityTriggered: false,
          securityReason: null,
        });
        updateUsage({ totalTokens: 0, fallback: false });
        controller.error(error);
      }
    },
  });

  return new Response(responseStream, { headers: STREAM_HEADERS });
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';

  // Guard: API key must be present (fail fast, avoid confusing downstream errors)
  if (!process.env.GROQ_API_KEY) {
    console.error('[ERROR] GROQ_API_KEY environment variable is not set.');
    return NextResponse.json(
      { error: 'Service unavailable: API key not configured.' },
      { status: 503 }
    );
  }

  try {
    // --- 1. Housekeeping (lightweight, no I/O) ---
    cleanCache();
    evictStaleRateLimitEntries(startTime);

    // --- 2. Rate limiting ---
    if (checkRateLimit(ip, startTime)) {
      console.warn(`[RATE LIMIT] IP: ${ip}`);
      const latencyMs = Date.now() - startTime;
      logRequest({
        requestId,
        ip,
        model: 'rate_limit',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        fallback: false,
        errorReason: 'Rate limit exceeded',
        providerStatus: 'rejected',
        cacheHit: false,
      });
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    // --- 3. Parse & validate request ---
    let messages;
    try {
      const body = await req.json();
      messages = body?.messages;
    } catch {
      const latencyMs = Date.now() - startTime;
      logRequest({
        requestId,
        ip,
        model: 'parser',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        fallback: false,
        errorReason: 'Invalid JSON body',
        providerStatus: 'rejected',
        cacheHit: false,
      });
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      const latencyMs = Date.now() - startTime;
      logRequest({
        requestId,
        ip,
        model: 'validator',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        fallback: false,
        errorReason: 'messages must be a non-empty array',
        providerStatus: 'rejected',
        cacheHit: false,
      });
      return NextResponse.json({ error: 'messages must be a non-empty array.' }, { status: 400 });
    }

    // Truncate to last 10 messages for token control
    const truncatedMessages = messages.slice(-10);
    const userPrompt = truncatedMessages.at(-1)?.content?.trim() ?? '';

    console.log('[CHATBOT REQUEST]', JSON.stringify({
      requestId,
      timestamp: new Date().toISOString(),
      ip,
      turns: truncatedMessages.length,
      lastMessage: userPrompt.slice(0, 100), // trim to avoid log bloat
    }));

    // --- 4. Security checks (PII, prompt injection, SQL injection) ---
    const securityCheck = runSecurityChecks(userPrompt);
    if (securityCheck.triggered) {
      const latencyMs = Date.now() - startTime;
      console.warn(`[SECURITY_VIOLATION] requestId: ${requestId}, IP: ${ip}, Reason: ${securityCheck.reason}`);
      logRequest({
        requestId,
        ip,
        model: 'security',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        fallback: false,
        errorReason: 'Security check failed',
        providerStatus: 'blocked',
        cacheHit: false,
        securityTriggered: true,
        securityReason: securityCheck.reason,
      });
      return NextResponse.json(
        { error: 'Your request was blocked for security reasons. Please try with a different query.' },
        { status: 403 }
      );
    }

    // --- 5. Cache check ---
    const staticAnswer = STATIC_ANSWERS[userPrompt.toLowerCase()];
    if (staticAnswer) {
      const cachedReply = getCachedAnswer(userPrompt) ?? staticAnswer;
      setCachedAnswer(userPrompt, cachedReply);
      const latencyMs = Date.now() - startTime;
      logRequest({
        requestId,
        ip,
        model: 'cache',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        latencyMs,
        fallback: false,
        errorReason: null,
        providerStatus: 'success',
        providerModel: 'static_cache',
        cacheHit: true,
      });
      updateUsage({ totalTokens: 0, fallback: false });
      return createTextStreamResponse(cachedReply);
    }

    // --- 6. LLM call with model fallback ---
    const { response: chatCompletionStream, modelUsed, fallback, providerStatus } = await getChatCompletionStream(
      groq,
      [{ role: 'system', content: SYSTEM_PROMPT }, ...truncatedMessages],
      MODEL_ORDER
    );
    return createGroqStreamResponse({
      stream: chatCompletionStream,
      requestId,
      ip,
      modelUsed,
      fallback,
      providerStatus,
      startTime,
    });

  } catch (error) {
    const latencyMs = Date.now() - startTime;
    logRequest({
      requestId,
      ip,
      model: 'unknown',
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs,
      fallback: false,
      errorReason: error.message,
      providerStatus: 'error',
      providerModel: null,
      cacheHit: false,
      securityTriggered: false,
      securityReason: null,
    });
    updateUsage({ totalTokens: 0, fallback: false });
    console.error('[CHATBOT ERROR]', { requestId, ip, message: error.message });
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
