/**
 * SepsisAI API service layer
 * All backend communication goes through this module.
 */
import axios from 'axios';
import { getToken } from './authApi.js';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const http = axios.create({
  baseURL: BASE,
  timeout: 90_000,
});

// Attach JWT on every request if available
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const API = {
  /**
   * POST /predict with a CSV File (multipart/form-data)
   * @param {File} file
   * @returns {Promise<PredictionResponse>}
   */
  async predictFromFile(file) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await http.post('/predict', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * POST /predict with a full feature dictionary (JSON body)
   * @param {{ [feature: string]: number }} features
   * @returns {Promise<PredictionResponse>}
   */
  async predictFromFeatures(features) {
    const { data } = await http.post('/predict', { features });
    return data;
  },

  /**
   * Backward-compatible alias for older callers.
   * @param {{ [feature: string]: number }} genes
   * @returns {Promise<PredictionResponse>}
   */
  async predictFromGenes(genes) {
    return this.predictFromFeatures(genes);
  },

  /**
   * GET /template — triggers template CSV download via anchor click
   */
  downloadTemplate() {
    const a = document.createElement('a');
    a.href = `${BASE}/template`;
    a.download = 'geo_expression_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * POST /generate-report — returns a Blob (application/pdf)
   * @param {{ patient_id: string, genes: object, prediction: object }} payload
   * @returns {Promise<Blob>}
   */
  async generateReport(payload) {
    const res = await http.post('/generate-report', payload, {
      responseType: 'blob',
    });
    return res.data;
  },
};

/**
 * Extracts a human-readable error message from an Axios error.
 * @param {Error} err
 * @returns {string | { validationErrors: string[] }}
 */
export function extractApiError(err) {
  if (!err?.response) return err.message || 'Network error — is the backend running?';
  const detail = err.response.data?.detail;
  if (!detail) return `Server error (${err.response.status})`;
  if (detail?.validation_errors) return { validationErrors: detail.validation_errors };
  if (typeof detail === 'string') return detail;
  return JSON.stringify(detail);
}

export default API;
