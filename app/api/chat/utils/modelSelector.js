/**
 * modelSelector.js — Groq model fallback selector with provider status tracking.
 *
 * Tries models in order and falls back on:
 *   - HTTP 429 (Too Many Requests)
 *   - Groq error code 'rate_limit_exceeded' or 'quota_exceeded'
 *
 * All other errors are re-thrown immediately so genuine failures
 * (bad API key, network issues) are surfaced clearly.
 *
 * Future extension: pass a `onFallback(fromModel, toModel, reason)` callback
 * to support RAG-aware fallback or conversation summarisation before retrying.
 */
export async function getChatCompletion(groq, messages, models) {
  let lastError = null;
  let providerStatus = 'error';

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    console.log(`[MODEL_SELECTOR] Trying model ${i + 1}/${models.length}: ${model}`);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.5,
        max_completion_tokens: 1024, // max_tokens is deprecated in newer Groq SDK
      });

      if (i > 0) {
        console.warn(`[MODEL_SELECTOR] Fell back to model: ${model}`);
        providerStatus = 'fallback';
      } else {
        providerStatus = 'success';
      }

      return {
        response: chatCompletion,
        modelUsed: model,
        fallback: i > 0,
        error: null,
        providerStatus,
      };
    } catch (err) {
      // Groq SDK surfaces status on the error object directly
      const status = err.status ?? err.statusCode ?? err.response?.status;
      // Groq error codes seen in practice
      const errMsg = (err.message || '').toLowerCase();
      const isQuotaError =
        status === 429 ||
        errMsg.includes('rate limit') ||
        errMsg.includes('quota') ||
        errMsg.includes('rate_limit') ||
        err.code === 'rate_limit_exceeded' ||
        err.code === 'quota_exceeded';

      if (isQuotaError) {
        console.warn(`[MODEL_SELECTOR] Quota/rate-limit hit on ${model}: ${err.message}`);
        providerStatus = 'rate_limited';
        lastError = err;
        continue; // try next model
      }

      // Non-quota error (bad key, network, etc.) — surface immediately
      providerStatus = 'error';
      throw err;
    }
  }

  // All models exhausted — throw the last quota error with context
  const exhaustedErr = lastError || new Error('All models in fallback chain failed');
  exhaustedErr.message = `[MODEL_SELECTOR] All ${models.length} models exhausted. Last error: ${lastError?.message}`;
  throw exhaustedErr;
}
