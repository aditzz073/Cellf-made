import React, { useState } from 'react';
import { API, extractApiError } from '../services/api.js';

/**
 * ReportDownload - button that triggers PDF report generation and download.
 *
 * Props:
 *   patientId           - string
 *   genes               - { [gene]: value }
 *   prediction          - { risk_score, risk_level, confidence, model_type }
 */
export default function ReportDownload({ patientId, genes, prediction }) {
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [errMsg, setErrMsg] = useState('');

  async function handleDownload() {
    setStatus('loading');
    setErrMsg('');
    try {
      const blob = await API.generateReport({
        patient_id: patientId || 'ANONYMOUS',
        genes,
        prediction,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SepsisAI_Report_${patientId || 'patient'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('idle');
    } catch (err) {
      const msg = extractApiError(err);
      setErrMsg(typeof msg === 'string' ? msg : 'Failed to generate report.');
      setStatus('error');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <button
        className="btn btn-primary btn-lg"
        onClick={handleDownload}
        disabled={status === 'loading'}
        style={{ minWidth: 260, gap: '0.6rem' }}
      >
        {status === 'loading' ? (
          <>
            <span className="spinner-sm" style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
            }} />
            Generating PDF…
          </>
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
              <path d="M14 2v5h5" />
              <path d="M9 13h6" />
              <path d="M9 17h6" />
            </svg>
            Download Clinical Report (PDF)
          </>
        )}
      </button>

      {status === 'error' && (
        <div className="alert alert-error" style={{ maxWidth: 400 }}>
          <svg className="w-4 h-4 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 9v4" strokeLinecap="round" />
            <circle cx="12" cy="17" r="1" />
            <path d="M10.3 3.8 1.8 18.2a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.8a2 2 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{errMsg}</span>
        </div>
      )}

      <p style={{
        fontSize: '0.72rem',
        color: 'var(--color-text-dim)',
        textAlign: 'center',
        maxWidth: 360,
      }}>
        The report includes a gene expression table, feature importances,
        heatmap, and risk summary. For research documentation only.
      </p>
    </div>
  );
}
