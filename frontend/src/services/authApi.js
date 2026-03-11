/**
 * services/authApi.js
 * All auth-related API calls + Axios interceptor that injects JWT.
 */
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Shared axios instance (also used by the existing api.js for predict routes)
export const authHttp = axios.create({
  baseURL: BASE,
  timeout: 30_000,
});

// ── Request interceptor — attach JWT from localStorage ──────────────────────
authHttp.interceptors.request.use((config) => {
  const token = localStorage.getItem('sepsisai_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token helpers ────────────────────────────────────────────────────────────
export function saveToken(token) {
  localStorage.setItem('sepsisai_token', token);
}

export function clearToken() {
  localStorage.removeItem('sepsisai_token');
}

export function getToken() {
  return localStorage.getItem('sepsisai_token');
}

// ── Auth API methods ─────────────────────────────────────────────────────────
export const AuthAPI = {
  async signup({ name, email, password, blood_group }) {
    const { data } = await authHttp.post('/auth/signup', { name, email, password, blood_group });
    return data;
  },

  async login({ email, password }) {
    const { data } = await authHttp.post('/auth/login', { email, password });
    if (data.access_token) saveToken(data.access_token);
    return data;
  },

  async me() {
    const { data } = await authHttp.get('/auth/me');
    return data;
  },

  async updateProfile(payload) {
    const { data } = await authHttp.put('/auth/update-profile', payload);
    return data;
  },

  logout() {
    clearToken();
  },
};
