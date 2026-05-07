// Api.js — Cliente HTTP centralizado con JWT
const API = {
  base: '/api',

  getToken() { return localStorage.getItem('sai_token'); },
  setToken(t) { localStorage.setItem('sai_token', t); },
  clearToken() { localStorage.removeItem('sai_token'); localStorage.removeItem('sai_user'); },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    const t = this.getToken();
    if (t) h['Authorization'] = 'Bearer ' + t;
    return h;
  },

  async get(ruta) {
    const r = await fetch(this.base + ruta, { headers: this.headers() });
    if (r.status === 401) { this.clearToken(); window.location.href = '/'; return null; }
    return r.json();
  },

  async post(ruta, datos) {
    const r = await fetch(this.base + ruta, { method: 'POST', headers: this.headers(), body: JSON.stringify(datos) });
    return r.json();
  },

  async patch(ruta, datos = {}) {
    const r = await fetch(this.base + ruta, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(datos) });
    return r.json();
  },

  async delete(ruta) {
    const r = await fetch(this.base + ruta, { method: 'DELETE', headers: this.headers() });
    return r.json();
  },

  getUsuario() {
    try { return JSON.parse(localStorage.getItem('sai_user')); } catch { return null; }
  },

  setUsuario(u) { localStorage.setItem('sai_user', JSON.stringify(u)); }
};
