import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

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
    
    // Structured Logging: Incoming Request
    console.log(`\n=== [CHATBOT REQUEST] ===`);
    console.log(`[Time]: ${new Date().toISOString()}`);
    console.log(`[IP Address]: ${ip}`);
    console.log(`[Conversation Turns]: ${messages.length}`);
    console.log(`[Last Message]: "${messages[messages.length - 1]?.content}"`);
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

    // --- 4. Call LLM ---
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "I couldn't process that right now.";
    const usage = chatCompletion.usage;
    const duration = Date.now() - startTime;

    // Structured Logging: Usage & Response
    console.log(`\n=== [CHATBOT RESPONSE] ===`);
    console.log(`[Status]: Success (${duration}ms)`);
    console.log(`[Tokens]: Prompt (${usage?.prompt_tokens}), Completion (${usage?.completion_tokens}), Total (${usage?.total_tokens})`);
    console.log(`==========================\n`);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("\n=== [CHATBOT ERROR] ===");
    console.error(`[IP Address]: ${ip}`);
    console.error(`[Message]:`, error.message);
    console.error(`=======================\n`);
    
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
