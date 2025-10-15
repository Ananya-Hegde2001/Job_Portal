const ENV_BASE = import.meta.env.VITE_API_URL && String(import.meta.env.VITE_API_URL).trim();

class Api {
  constructor() {
    this.token = null;
    this.base = null; // resolved base like http://localhost:4000/api
    this.basePromise = null;
  }
  setToken(t) { this.token = t; }
  async resolveBase() {
    if (this.base) return this.base;
    if (this.basePromise) return this.basePromise;
    this.basePromise = (async () => {
      const tried = new Set();
      const candidates = [];
      if (ENV_BASE) candidates.push(ENV_BASE);
      candidates.push('http://localhost:4000/api');
      for (let p = 4000; p <= 4015; p++) {
        const url = `http://localhost:${p}/api`;
        if (!candidates.includes(url)) candidates.push(url);
      }
      const TIMEOUT_MS = 1500;
      for (const c of candidates) {
        if (tried.has(c)) continue; tried.add(c);
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
          const res = await fetch(c + '/health', { method: 'GET', signal: ctrl.signal });
          clearTimeout(to);
          if (res.ok) {
            // Basic check for JSON shape, ignore failures
            await res.json().catch(() => ({}));
            if (c !== ENV_BASE && ENV_BASE) console.warn(`[api] Falling back from VITE_API_URL to ${c}`);
            this.base = c; return c;
          }
        } catch (_) { /* try next */ }
      }
      // Last resort: default to env or 4000
      this.base = ENV_BASE || 'http://localhost:4000/api';
      return this.base;
    })();
    return this.basePromise;
  }
  async request(path, options = {}, _retried = false) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const base = await this.resolveBase();
    try {
      const ctrl = new AbortController();
      const TIMEOUT_MS = options.timeoutMs || (path.startsWith('/ai/') ? 30000 : 8000);
      const { timeoutMs, ...fetchOpts } = options; // strip custom field
      const to = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(base + path, { ...fetchOpts, headers, signal: ctrl.signal });
      clearTimeout(to);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      // If network error or failed to fetch, try re-discovering once
      const msg = String(err && err.message || err || '');
      const isNetwork = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network');
      if (!_retried && isNetwork) {
        this.base = null; this.basePromise = null;
        await this.resolveBase();
        return this.request(path, options, true);
      }
      throw err;
    }
  }
  get(p) { return this.request(p); }
  post(p, body) { return this.request(p, { method: 'POST', body: JSON.stringify(body) }); }
  put(p, body) { return this.request(p, { method: 'PUT', body: JSON.stringify(body) }); }
  del(p) { return this.request(p, { method: 'DELETE' }); }
  // alias to support existing code using api.delete
  delete(p) { return this.del(p); }

  // Upload multipart form-data (e.g., avatar/resume). Pass FormData, do not set Content-Type.
  async upload(path, formData, method = 'POST') {
    const base = await this.resolveBase();
    const headers = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(base + path, { method, headers, body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // Fetch binary/blob data with auth header
  async getBlob(path) {
    const base = await this.resolveBase();
    const headers = {};
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(base + path, { method: 'GET', headers });
    if (!res.ok) throw new Error('Download failed');
    return await res.blob();
  }
  // Payments
  createOrder(amountPaise, metadata = {}) {
    return this.request('/payments/order', {
      method: 'POST',
      body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt: metadata.receipt || undefined })
    });
  }

  verifyPayment(payload) {
    return this.request('/payments/verify', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Submit feedback/support message
  submitFeedback(email, message){
    return this.post('/feedback', { email, message });
  }

  // Saved jobs
  listSavedJobs(){ return this.get('/saved/jobs'); }
  toggleSaveJob(jobId){ return this.post(`/saved/jobs/${jobId}`, {}); }

  // Job alerts
  listAlerts(){ return this.get('/saved/alerts'); }
  createAlert(subject, location){ return this.post('/saved/alerts', { subject, location }); }
  deleteAlert(id){ return this.delete(`/saved/alerts/${id}`); }

  // Application timeline & messaging
  getApplicationTimeline(appId){ return this.get(`/applications/${appId}/timeline`); }
  postApplicationMessage(appId, body){ return this.post(`/applications/${appId}/messages`, { body }); }
  postApplicationNote(appId, note){ return this.post(`/applications/${appId}/notes`, { note }); }

  // AI Chat
  aiChat(prompt, reset=false){
    // Use longer timeout for model inference
    return this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ prompt, reset }), timeoutMs: 30000 });
  }

  aiChatStream(prompt, { reset=false, fast=false, onDelta, onDone, onError } = {}) {
    const controller = new AbortController();
    (async () => {
      try {
        const base = await this.resolveBase();
        const res = await fetch(base + '/ai/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept':'text/event-stream', ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}) },
          body: JSON.stringify({ prompt, reset, fast }),
          signal: controller.signal
        });
        if (!res.ok && res.status !== 200) {
          onError && onError(new Error('Stream request failed: ' + res.status));
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let opened = false;
        let receivedAny = false;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split(/\n\n/);
          buffer = parts.pop();
          for (const part of parts) {
            if (!part.startsWith('data:')) continue;
            const json = part.replace(/^data:\s*/, '');
            if (!json.trim()) continue;
            try {
              const obj = JSON.parse(json);
              if (obj.open) { opened = true; continue; }
              if (obj.ping) { continue; }
              if (obj.delta && onDelta) onDelta(obj.delta);
              if (obj.delta) receivedAny = true;
              if (obj.error && onError) onError(new Error(obj.error));
              if (obj.done && onDone) onDone(obj);
            } catch (_) { /* ignore parse errors */ }
          }
        }
        if (buffer.trim()) {
          // final dangling buffer attempt
          try { const obj = JSON.parse(buffer.replace(/^data:\s*/, '')); if (obj.done && onDone) onDone(obj); } catch(_){ }
        }
        // If connection ended with no data, trigger fallback fetch
        if (!receivedAny && onError) {
          onError(new Error('Empty stream response'));
        }
      } catch (e) {
        if (onError) onError(e);
      }
    })();
    return { abort: () => controller.abort() };
  }
}

export const api = new Api();
