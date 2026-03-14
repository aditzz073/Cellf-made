/**
 * api/client.js
 * Axios instance pre-configured for the SepsisAI FastAPI backend.
 * All routes are proxied through Vite (/api → http://localhost:8000)
 * during development.  In production set VITE_API_BASE_URL env var.
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60_000,   // 60 s - PDF generation can be slow
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * POST /predict with a CSV file (multipart/form-data)
 * @param {File} file
 */
export async function predictFromCSV(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post('/predict', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/**
 * POST /predict with a manual gene-expression dictionary
 * @param {{ [gene: string]: number }} genes
 */
export async function predictFromGenes(genes) {
  const { data } = await apiClient.post('/predict', { genes });
  return data;
}

/**
 * GET /template - triggers CSV file download
 */
export function downloadTemplate() {
  const url = `${BASE_URL}/template`;
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'gene_expression_template.csv';
  anchor.click();
}

/**
 * POST /generate-report - returns a Blob for PDF download
 * @param {{ patient_id: string, genes: object, prediction: object }} payload
 */
export async function generateReport(payload) {
  const response = await apiClient.post('/generate-report', payload, {
    responseType: 'blob',
  });
  return response.data;
}

export default apiClient;
