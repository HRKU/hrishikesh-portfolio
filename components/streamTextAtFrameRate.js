'use client';

export async function streamTextAtFrameRate(response, onUpdate, options = {}) {
  const {
    charsPerSecond = 26,
    minFrameMs = 40,
    maxFrameMs = 110,
    punctuationPauseMs = 180,
    onComplete = null,
  } = options;

  if (!response.body) {
    throw new Error('Missing response stream.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let displayed = '';
  let doneReading = false;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const chunkDelayFor = (chunk) => {
    const base = Math.max(
      minFrameMs,
      Math.min(maxFrameMs, Math.round((chunk.length / charsPerSecond) * 1000))
    );

    const tail = chunk.trimEnd().slice(-1);
    if (/[.!?]/.test(tail)) return base + punctuationPauseMs;
    if (/[,;:]/.test(tail)) return base + Math.round(punctuationPauseMs * 0.55);
    if (/\n$/.test(chunk)) return base + Math.round(punctuationPauseMs * 0.65);
    return base;
  };

  const pump = async () => {
    while (true) {
      if (buffer.length === 0) {
        if (doneReading) break;
        await sleep(8);
        continue;
      }

      const burstSize =
        buffer.length > 120 ? 12 :
        buffer.length > 60 ? 8 :
        buffer.length > 24 ? 5 : 3;

      const nextChunk = buffer.slice(0, burstSize);
      buffer = buffer.slice(burstSize);
      displayed += nextChunk;
      onUpdate(displayed);
      await sleep(chunkDelayFor(nextChunk));
    }

    onUpdate(displayed);
    onComplete?.(displayed);
  };

  const pumpPromise = pump();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      doneReading = true;
      break;
    }

    if (value) {
      buffer += decoder.decode(value, { stream: true });
    }
  }

  buffer += decoder.decode();
  doneReading = true;
  await pumpPromise;
}
