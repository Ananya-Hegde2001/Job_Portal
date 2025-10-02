import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

// In-memory sessions keyed by user id (or 'anon') for simple context retention
const sessions = new Map();

const router = express.Router();

/*
  POST /api/ai/chat
  body: { prompt: string, reset?: boolean }
  auth is optional for now; if you want to require auth wrap with middleware
*/
// Simple in-process model cache after first success
let cachedModel = null; // string of chosen model
let cachedSdk = null;   // '@google/genai' or '@google/generative-ai'

// GET /api/ai/diagnostics  (non-destructive quick check)
router.get('/ai/diagnostics', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelEnv = process.env.GEMINI_MODEL;
  if (!apiKey) return res.status(400).json({ ok:false, error:'Missing GEMINI_API_KEY' });
  return res.json({ ok:true, modelEnv, cachedModel, cachedSdk });
});

router.post('/ai/chat', async (req, res) => {
  const started = Date.now();
  const { prompt, reset } = req.body || {};
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt required' });
  const uid = req.user?.id || 'anon';
  if (reset) sessions.delete(uid);
  let history = sessions.get(uid) || [];
  history.push({ role: 'user', content: prompt.trim() });

  const apiKey = process.env.GEMINI_API_KEY;
  const preferred = (process.env.GEMINI_MODEL || '').trim();
  // Ordered fallback list – will try preferred first (if provided)
  const modelCandidates = Array.from(new Set([
    preferred || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash'
  ])).filter(Boolean);
  const system = 'You are an academic hiring & career assistant. Provide concise, structured, factual guidance with bullet points where useful.';
  let reply = '';
  const meta = { model: null, chosenModel: null, latency: null, provider: 'google', sdk: true, attemptedModels: [], sdkTried: [], sdkUsed: null };
  const dev = process.env.NODE_ENV !== 'production';

  if (!apiKey) {
    reply = 'No GEMINI_API_KEY configured (.env). Add it and restart the server.\nEcho: ' + prompt.slice(0,400);
  } else {
    let success = false; let lastErr = null;
    // helper to transform history into prompt text (for new SDK simple usage)
    const historyText = history.map(m => (m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`)).join('\n');
    const compositePrompt = `${system}\n\n${historyText}`;
    // helper for old/new structured contents
    const buildContentsArray = () => ([
      { role: 'user', parts: [{ text: system }] },
      ...history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
    ]);
    const extractReply = (r) => {
      if (!r) return '';
      // New @google/genai style
      if (typeof r.text === 'string' && r.text) return r.text;
      if (r.output_text) return r.output_text;
      if (Array.isArray(r.candidates)) {
        for (const c of r.candidates) {
          if (c.content && Array.isArray(c.content.parts)) {
            const t = c.content.parts.map(p => p.text || '').filter(Boolean).join('\n').trim();
            if (t) return t;
          }
        }
      }
      // Old SDK response pattern
      if (r.response && typeof r.response.text === 'function') {
        const t = r.response.text();
        if (t) return t;
      }
      return '';
    };
    for (const candidate of modelCandidates) {
      meta.attemptedModels.push(candidate);
      // Try new @google/genai first
      try {
        meta.sdkTried.push('@google/genai');
        const { GoogleGenAI } = await import('@google/genai');
        // If apiKey omitted, library will look up GEMINI_API_KEY env itself; still pass for explicitness
        const ai = new GoogleGenAI({ apiKey });
        // Use simple composite string first (reduces schema mismatch risk)
        const result = await ai.models.generateContent({ model: candidate, contents: compositePrompt });
        reply = extractReply(result) || 'No response generated.';
        meta.latency = Date.now() - started;
        meta.chosenModel = candidate;
        meta.sdkUsed = '@google/genai';
        cachedModel = candidate; cachedSdk = meta.sdkUsed;
        success = true;
        break;
      } catch (e1) {
        lastErr = e1;
        console.warn('[AI] genai SDK failed', candidate, e1.message);
        // Fallback to old SDK
        try {
          meta.sdkTried.push('@google/generative-ai');
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: candidate });
          const result = await model.generateContent({ contents: buildContentsArray() });
          reply = extractReply(result) || 'No response generated.';
          meta.latency = Date.now() - started;
          meta.chosenModel = candidate;
          meta.sdkUsed = '@google/generative-ai';
          cachedModel = candidate; cachedSdk = meta.sdkUsed;
          success = true;
          break;
        } catch (e2) {
          lastErr = e2;
          console.warn('[AI] fallback generative-ai SDK failed', candidate, e2.message);
          // proceed to next candidate
        }
      }
    }
    if (!success) {
      const eMsg = (lastErr && lastErr.message) || 'Unknown error';
      meta.error = eMsg;
      if (dev && lastErr && lastErr.stack) meta.errorStack = lastErr.stack.split('\n').slice(0,6).join('\n');
      if (/permission|403|apikey|key/i.test(eMsg)) {
        reply = 'API key rejected (403). Enable Gemini / Generative AI API for this key.';
      } else if (/not found|404|model name not recognized/i.test(eMsg)) {
        reply = 'All model candidates failed (model not found). Set GEMINI_MODEL to a supported model, e.g. gemini-2.5-flash or gemini-1.5-flash-latest.';
      } else if (/network|fetch|ENOTFOUND|EAI_AGAIN/i.test(eMsg)) {
        reply = 'Network error contacting Gemini API. Check connectivity / firewall and retry.';
      } else {
        reply = 'AI request failed after trying: ' + modelCandidates.join(', ') + '. ' + eMsg;
      }
      // Send a non-200 status to let client surface error distinctly
      return res.status(502).json({ reply, meta });
    }
  }

  history.push({ role: 'assistant', content: reply });
  if (history.length > 32) history = history.slice(-32);
  sessions.set(uid, history);
  res.json({ reply, meta });
});

// Streaming endpoint for faster perceived responses
router.post('/ai/chat/stream', async (req, res) => {
  const started = Date.now();
  const { prompt, reset, fast } = req.body || {};
  if (!prompt || !prompt.trim()) return res.status(400).json({ error: 'Prompt required' });
  const uid = req.user?.id || 'anon';
  if (reset) sessions.delete(uid);
  let history = sessions.get(uid) || [];
  history.push({ role: 'user', content: prompt.trim() });
  const apiKey = process.env.GEMINI_API_KEY;
  const preferred = (process.env.GEMINI_MODEL || '').trim();
  const modelCandidates = Array.from(new Set([
    cachedModel || preferred || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash'
  ])).filter(Boolean);
  const systemLong = 'You are an academic hiring & career assistant. Provide concise, structured, factual guidance with bullet points where useful.';
  const systemFast = 'You are a concise academic career assistant. Reply briefly with key bullet points.';
  const system = fast ? systemFast : systemLong;
  // Reduce history size further in fast mode
  const effectiveHistory = fast ? history.slice(-8) : history.slice(-24);

  if (!apiKey) {
    return res.status(400).json({ error: 'Missing GEMINI_API_KEY' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // Disable buffering on some proxies (nginx) so events flush
  res.setHeader('X-Accel-Buffering', 'no');
  // CORS flush for some proxies
  res.flushHeaders?.();

  const sendEvent = (obj) => {
    res.write(`data: ${JSON.stringify(obj)}\n\n`);
  };

  // Early open signal for client
  sendEvent({ open: true });
  // Heartbeat every 12s to keep connection alive while model is thinking
  const heartbeat = setInterval(()=>{
    try { sendEvent({ ping: Date.now() }); } catch(_){}
  }, 12000);

  let success = false; let lastErr = null;
  const historyText = effectiveHistory.map(m => (m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`)).join('\n');
  const compositePrompt = `${system}\n\n${historyText}`;
  const buildContentsArray = () => ([
    { role: 'user', parts: [{ text: system }] },
    ...effectiveHistory.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }))
  ]);
  const generationConfig = fast ? { maxOutputTokens: 256, temperature: 0.7, topK: 40, topP: 0.95 } : { maxOutputTokens: 768, temperature: 0.8, topK: 64, topP: 0.95 };

  for (const candidate of modelCandidates) {
    try {
      // Try new streaming first
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const stream = await ai.models.generateContentStream({ model: candidate, contents: compositePrompt, generationConfig });
        let collected = '';
        for await (const chunk of stream.stream) {
          const txt = chunk.text();
            if (txt) {
            collected += txt;
            sendEvent({ delta: txt });
          }
        }
        sendEvent({ done: true, model: candidate, latency: Date.now() - started, sdk: '@google/genai' });
        cachedModel = candidate; cachedSdk = '@google/genai';
        history.push({ role:'assistant', content: collected || '(empty)' });
        if (history.length > 32) history = history.slice(-32);
        sessions.set(uid, history);
        success = true; break;
      } catch (primary) {
        lastErr = primary;
        // Fallback to old SDK streaming
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: candidate, generationConfig });
          const stream = await model.generateContentStream({ contents: buildContentsArray() });
          let collected = '';
          for await (const chunk of stream.stream) {
            const part = chunk.text();
            if (part) {
              collected += part;
              sendEvent({ delta: part });
            }
          }
          sendEvent({ done: true, model: candidate, latency: Date.now() - started, sdk: '@google/generative-ai' });
          cachedModel = candidate; cachedSdk = '@google/generative-ai';
          history.push({ role:'assistant', content: collected || '(empty)' });
          if (history.length > 32) history = history.slice(-32);
          sessions.set(uid, history);
          success = true; break;
        } catch (fallback) {
          lastErr = fallback;
        }
      }
    } catch (e) {
      lastErr = e;
    }
  }

  if (!success) {
    const eMsg = lastErr?.message || 'Unknown error';
    sendEvent({ error: eMsg, modelTried: modelCandidates });
    sendEvent({ done: true });
  }
  clearInterval(heartbeat);
  res.end();
});

export default router;
