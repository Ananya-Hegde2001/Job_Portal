const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class Api {
  constructor() { this.token = null; }
  setToken(t) { this.token = t; }
  async request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    const res = await fetch(base + path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  }
  get(p) { return this.request(p); }
  post(p, body) { return this.request(p, { method: 'POST', body: JSON.stringify(body) }); }
  put(p, body) { return this.request(p, { method: 'PUT', body: JSON.stringify(body) }); }
  del(p) { return this.request(p, { method: 'DELETE' }); }
}

export const api = new Api();
