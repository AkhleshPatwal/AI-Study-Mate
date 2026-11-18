import express from 'express';
import { GoogleGenAI } from '@google/genai';

export function getGeminiClient(req: express.Request, apiVersion?: string): GoogleGenAI {
  const userApiKey = req.headers['x-gemini-api-key'] as string | undefined;
  const apiKey =
    userApiKey && userApiKey.trim() !== ''
      ? userApiKey.trim()
      : process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('NO_API_KEY');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      ...(apiVersion ? { apiVersion } : {}),
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRetryableModelError(err: any): boolean {
  const msg = String(err?.message || '').toUpperCase();
  const status = err?.status || err?.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 404 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('HIGH DEMAND') ||
    msg.includes('OVERLOADED') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('NOT FOUND')
  );
}

export async function generateWithFallback(
  ai: GoogleGenAI,
  models: string[],
  buildParams: (model: string) => any
) {
  let lastError: any;
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await ai.models.generateContent(buildParams(model));
      } catch (err: any) {
        lastError = err;
        if (!isRetryableModelError(err)) {
          throw err;
        }
        // Small backoff before retry or switching to fallback model
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
        if (attempt === 0 && i < models.length - 1) {
          // Move promptly to fallback model on 503/404 after single quick retry
          break;
        }
      }
    }
  }
  throw lastError;
}

export function parseGeminiJson<T = any>(responseText: string, fallback = '{}'): T {
  const raw = (responseText || fallback).trim();
  try {
    return JSON.parse(raw) as T;
  } catch {
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  }
}

export function extractPcmFromWav(wavBuf: Buffer): Buffer {
  if (wavBuf.length < 44) return wavBuf;
  const riff = wavBuf.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    return wavBuf;
  }

  let offset = 12;
  while (offset + 8 <= wavBuf.length) {
    const chunkId = wavBuf.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuf.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const start = offset + 8;
      const end = Math.min(start + chunkSize, wavBuf.length);
      return wavBuf.subarray(start, end);
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return wavBuf.subarray(44);
}

export function wrapPcmInWav(
  pcmBuf: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmBuf.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM format chunk size
  header.writeUInt16LE(1, 20); // AudioFormat 1 = PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcmBuf.length, 40);

  return Buffer.concat([header, pcmBuf]);
}
