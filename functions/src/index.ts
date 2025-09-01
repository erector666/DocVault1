import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
// Dynamic import for node-fetch to handle ESM compatibility

// Initialize Admin SDK
try {
  admin.initializeApp();
} catch {}

// In-memory caches (ephemeral in serverless, but useful within instance lifetime)
const translateLanguagesCache: { data: any[]; timestamp: number } = { data: [], timestamp: 0 };
const translationCache: Record<string, { translatedText: string; sourceLanguage: string; targetLanguage: string; confidence: number; timestamp: number }> = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Helpers
const assertAuthenticated = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }
};

// Translation - basic implementation using Google Translation API via REST
// Requires: process.env.GOOGLE_TRANSLATE_API_KEY
export const getSupportedLanguages = onCall(async () => {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Missing GOOGLE_TRANSLATE_API_KEY');
  }
  // Serve from cache if fresh
  if (translateLanguagesCache.data.length && Date.now() - translateLanguagesCache.timestamp < CACHE_TTL_MS) {
    return { languages: translateLanguagesCache.data };
  }
  const url = `https://translation.googleapis.com/language/translate/v2/languages?key=${apiKey}&target=en`;
  const fetch = (await import('node-fetch')).default;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new functions.https.HttpsError('internal', `Translate API error: ${resp.status}`);
  }
  const data = (await resp.json()) as any;
  const languages = (data.data?.languages || []).map((l: any) => ({ code: l.language, name: l.name }));
  translateLanguagesCache.data = languages;
  translateLanguagesCache.timestamp = Date.now();
  return { languages };
});

export const translateDocument = onCall(async (request) => {
  const { documentUrl, targetLanguage, sourceLanguage } = request.data as {
    documentUrl: string;
    targetLanguage: string;
    sourceLanguage?: string;
  };
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Missing GOOGLE_TRANSLATE_API_KEY');
  }
  const cacheKey = `${documentUrl}::${sourceLanguage || 'auto'}::${targetLanguage}`;
  const cached = translationCache[cacheKey];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }
  // For MVP, assume the documentUrl points to raw text content
  const fetch = (await import('node-fetch')).default;
  const docResp = await fetch(documentUrl);
  if (!docResp.ok) {
    throw new functions.https.HttpsError('not-found', 'Unable to fetch document content');
  }
  const text = await docResp.text();
  const body = {
    q: text,
    target: targetLanguage,
    ...(sourceLanguage ? { source: sourceLanguage } : {}),
    format: 'text',
  } as any;
  const resp = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    throw new functions.https.HttpsError('internal', `Translate API error: ${resp.status}`);
  }
  const data = (await resp.json()) as any;
  const translatedText = data.data?.translations?.[0]?.translatedText || '';
  const result = {
    translatedText,
    sourceLanguage: sourceLanguage || data.data?.translations?.[0]?.detectedSourceLanguage || 'en',
    targetLanguage,
    confidence: 0.9,
  } as const;
  translationCache[cacheKey] = { ...result, timestamp: Date.now() } as any;
  return result;
});

// Simple text translation (no document URL required)
export const translateText = onCall(async (request) => {
  const { text, targetLanguage, sourceLanguage } = request.data as {
    text: string;
    targetLanguage: string;
    sourceLanguage?: string;
  };
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new functions.https.HttpsError('failed-precondition', 'Missing GOOGLE_TRANSLATE_API_KEY');
  }
  
  const body = {
    q: text,
    target: targetLanguage,
    ...(sourceLanguage ? { source: sourceLanguage } : {}),
    format: 'text',
  } as any;
  
  const fetch = (await import('node-fetch')).default;
  const resp = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!resp.ok) {
    throw new functions.https.HttpsError('internal', `Translate API error: ${resp.status}`);
  }
  
  const data = (await resp.json()) as any;
  const translatedText = data.data?.translations?.[0]?.translatedText || '';
  
  return {
    translatedText,
    sourceLanguage: sourceLanguage || data.data?.translations?.[0]?.detectedSourceLanguage || 'en',
    targetLanguage,
    confidence: 0.9,
  };
});
