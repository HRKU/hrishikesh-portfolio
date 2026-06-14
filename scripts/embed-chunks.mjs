#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const MODEL = 'BAAI/bge-small-en-v1.5';

// ─── Simple .env parser to avoid external dependencies ────────────────────────
function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = (match[2] || '').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
  } catch (err) {
    console.warn('[ENV] Warning: Failed to load .env file:', err.message);
  }
}

// ─── Fetch embeddings from Hugging Face with Retry for 503s ──────────────────
async function getEmbeddingsWithRetry(texts, token, retries = 5, delayMs = 5000) {
  const url = `https://router.huggingface.co/hf-inference/models/${MODEL}/pipeline/feature-extraction`;
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: texts }),
      });

      if (res.status === 503) {
        const payload = await res.json().catch(() => ({}));
        const waitTime = payload.estimated_time ? Math.ceil(payload.estimated_time) * 1000 : delayMs;
        console.warn(`[HF_API] Model is currently loading. Waiting ${waitTime / 1000}s before retry ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HF API returned HTTP ${res.status}: ${errText}`);
      }

      const embeddings = await res.json();
      if (!Array.isArray(embeddings)) {
        throw new Error('HF API response is not an array.');
      }
      return embeddings;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`[HF_API] Request failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

async function processFile(inputPath, outputPath, token) {
  if (!fs.existsSync(inputPath)) {
    console.error(`[ERROR] Input file not found: ${inputPath}`);
    return;
  }

  console.log(`[PROCESS] Reading chunks from ${path.basename(inputPath)}...`);
  const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  if (!chunks.length) {
    console.warn(`[PROCESS] No chunks found in ${inputPath}. Skipping.`);
    return;
  }

  // Extract texts to embed
  const texts = chunks.map(c => c.text);

  console.log(`[PROCESS] Requesting embeddings for ${chunks.length} chunks using ${MODEL}...`);
  const vectors = await getEmbeddingsWithRetry(texts, token);

  if (vectors.length !== chunks.length) {
    throw new Error(`Mismatch in response length. Expected ${chunks.length} vectors, got ${vectors.length}`);
  }

  // Merge vectors into chunks
  const embeddedChunks = chunks.map((chunk, idx) => ({
    ...chunk,
    vector: vectors[idx],
  }));

  fs.writeFileSync(outputPath, JSON.stringify(embeddedChunks, null, 2) + '\n', 'utf8');
  console.log(`[SUCCESS] Wrote ${embeddedChunks.length} embedded chunks to ${outputPath}`);
}

async function main() {
  loadEnv();

  const token = process.env.HF_INFERENCE_KEY;
  if (!token) {
    console.error('[ERROR] HF_INFERENCE_KEY is not defined in environment or .env file.');
    console.error('Please get a token from https://huggingface.co/settings/tokens and add it to .env');
    process.exit(1);
  }

  try {
    const dataDir = path.join(process.cwd(), 'data', 'chunks');
    const filesToProcess = [
      {
        input: path.join(dataDir, 'ai-resume.json'),
        output: path.join(dataDir, 'ai-resume-embedded.json')
      },
      {
        input: path.join(dataDir, 'fullstack-resume.json'),
        output: path.join(dataDir, 'fullstack-resume-embedded.json')
      }
    ];

    for (const file of filesToProcess) {
      await processFile(file.input, file.output, token);
    }

    console.log('[SUCCESS] All resume embeddings generated successfully.');
  } catch (err) {
    console.error('[ERROR] Embedding generation failed:', err.message);
    process.exit(1);
  }
}

main();
