/**
 * Model selector with automatic fallback on quota errors.
 *
 * Usage:
 *   const models = [
 *     'meta-llama/llama-4-scout-17b-16e-instruct',
 *     'qwen/qwen3-32b',
 *     'llama-3.3-70b-versatile',
 *     'llama-3.1-8b-instant',
 *   ];
 *   const { response, modelUsed, fallback } = await getChatCompletion(groq, messages, models);
 */
export async function getChatCompletion(groq, messages, models) {
  let lastError = null;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.5,
        max_tokens: 1024,
      });
      return {
        response: chatCompletion,
        modelUsed: model,
        fallback: i > 0, // true if we are not on the first (primary) model
        error: null,
      };
    } catch (err) {
      // Detect quota / rate‑limit errors – Groq returns 429 or a code like 'rate_limit'
      const status = err.status || (err.response && err.response.status);
      const code = err.code || (err.response && err.response.data && err.response.data.error && err.response.data.error.code);
      if (status === 429 || code === 'rate_limit' || code === 'quota_exceeded') {
        // Expected fallback condition – try next model
        lastError = err;
        continue;
      }
      // Unexpected error – abort fallback chain and rethrow
      throw err;
    }
  }
  // All models exhausted
  throw lastError || new Error('All models failed without a recognizable quota error');
}
