import { NextResponse } from 'next/server';
import Groq from "groq-sdk";
import { logRequest, updateUsage, getUsage } from './utils/logger';
import { getChatCompletion } from './utils/modelSelector';
import { getCachedAnswer, setCachedAnswer } from './utils/cache';

const rateLimitMap = new Map();
const RATE_LIMIT = 10; 
const TIME_WINDOW = 60 * 1000;

export async function POST(req) {
  const startTime = Date.now();
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  
  try {
    // --- 1. Rate Limiting ---
    if (rateLimitMap.has(ip)) {
      const data = rateLimitMap.get(ip);
      if (startTime - data.startTime > TIME_WINDOW) {
        rateLimitMap.set(ip, { count: 1, startTime: startTime });
      } else {
        if (data.count >= RATE_LIMIT) {
          console.warn(`[RATE LIMIT EXCEEDED] IP: ${ip}`);
          return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        data.count++;
        rateLimitMap.set(ip, data);
      }
    } else {
      rateLimitMap.set(ip, { count: 1, startTime: startTime });
    }

    // --- 2. Parse Request ---
    const { messages } = await req.json();
    
    // Truncate conversation to last 10 messages for token control
    const truncatedMessages = messages.slice(-10);

    // Structured Logging: Incoming Request
    console.log(`\n=== [CHATBOT REQUEST] ===`);
    console.log(`[Time]: ${new Date().toISOString()}`);
    console.log(`[IP Address]: ${ip}`);
    console.log(`[Conversation Turns]: ${truncatedMessages.length}`);
    console.log(`[Last Message]: "${truncatedMessages[truncatedMessages.length - 1]?.content}"`);
    console.log(`=========================\n`);

    const apiKey = process.env.groq_api_key || process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[ERROR] Groq API Key missing.");
      return NextResponse.json({ reply: "Error: GROQ_API_KEY is not configured." });
    }

    const groq = new Groq({ apiKey: apiKey });

    // --- 3. System Prompt ---
    const systemPrompt = `
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

    // --- 4. Call LLM with fallback & caching ---
    const userPrompt = truncatedMessages[truncatedMessages.length - 1]?.content?.trim();
    // Check cache for static questions
    const staticAnswers = {
      "who is hrishikesh?": "Hrishikesh Upadhyaya is a Full Stack & AI Developer based in Pune, India, specializing in Next.js, AI agents, and cloud architectures.",
      "tell me about run2feed": "Run2Feed is a marathon platform built with Next.js, Docker, and Easebuzz payment integration, enabling seamless race registrations and results.",
      "what technologies do you use?": "The stack includes JavaScript/TypeScript, Next.js, React, Node.js, Express, MongoDB, SQL, Azure OpenAI, AutoGen, RAG pipelines, Docker, and CI/CD.",
      "show your projects": "Key projects: Run2Feed Marathon Platform, Ticketing System, AI Chatbot with multi‑agent architecture, and several fintech modules.",
    };
    if (userPrompt && staticAnswers[userPrompt.toLowerCase()]) {
      const cached = getCachedAnswer(userPrompt) || staticAnswers[userPrompt.toLowerCase()];
      // Store in cache for future calls
      setCachedAnswer(userPrompt, cached);
      const usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      const duration = Date.now() - startTime;
      logRequest({ ip, model: "cache", promptTokens: 0, completionTokens: 0, totalTokens: 0, latencyMs: duration, fallback: false, errorReason: null });
      updateUsage({ totalTokens: 0, fallback: false });
      return NextResponse.json({ reply: cached });
    }
    // Define fallback model order
    const modelOrder = [
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "qwen/qwen3-32b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
    ];
    const { response: chatCompletion, modelUsed, fallback } = await getChatCompletion(groq, [
      { role: "system", content: systemPrompt },
      ...truncatedMessages,
    ], modelOrder);

    const reply = chatCompletion.choices[0]?.message?.content || "I couldn't process that right now.";
    const usage = chatCompletion.usage;
    const duration = Date.now() - startTime;

    // Structured Logging: Usage & Response
    logRequest({
      ip,
      model: modelUsed,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
      latencyMs: duration,
      fallback,
      errorReason: null,
    });
    updateUsage({ totalTokens: usage?.total_tokens || 0, fallback });

    console.log(`\n=== [CHATBOT RESPONSE] ===`);
    console.log(`[Status]: Success (${duration}ms)`);
    console.log(`[Tokens]: Prompt (${usage?.prompt_tokens}), Completion (${usage?.completion_tokens}), Total (${usage?.total_tokens})`);
    console.log(`==========================\n`);

    return NextResponse.json({ reply });
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    logRequest({
      ip,
      model: "unknown",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      latencyMs: errorDuration,
      fallback: false,
      errorReason: error.message,
    });
    updateUsage({ totalTokens: 0, fallback: false });
    console.error("\n=== [CHATBOT ERROR] ===");
    console.error(`[IP Address]: ${ip}`);
    console.error(`[Message]:`, error.message);
    console.error(`=======================\n`);
    
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
