/**
 * components/CSVUpload.jsx
 * Drag-and-drop + click-to-browse CSV upload panel.
 * Includes template download link and client-side file-type validation.
 */

import React, { useState, useRef, useCallback } from 'react';
import { downloadTemplate } from '../api/client.js';

export default function CSVUpload({ onSubmit, isLoading }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  // ── File validation ───────────────────────────────────────────────────────
  const validateAndSet = useCallback((f) => {
    setLocalError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setLocalError('Only .csv files are accepted. Please check the file type and try again.');
      setFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setLocalError('File size exceeds 5 MB. Please reduce the number of rows or check your CSV.');
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const onFileChange = (e) => validateAndSet(e.target.files?.[0]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setLocalError('Please select a CSV file before running the prediction.');
      return;
    }
    onSubmit(file);
  };

  const handleClear = () => {
    setFile(null);
    setLocalError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Template download prompt */}
      <div style={styles.templateRow}>
        <span style={styles.templateText}>
          Need the expected format?
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={styles.templateBtn}
          onClick={downloadTemplate}
        >
          <DownloadIcon /> Download CSV Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        style={{
          ...styles.dropZone,
          ...(dragOver ? styles.dropZoneActive : {}),
          ...(file ? styles.dropZoneSuccess : {}),
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !file && fileInputRef.current?.click()}
        role="button"
        aria-label="Click or drag a CSV file here"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !file && fileInputRef.current?.click()}
      >
        {file ? (
          <div style={styles.fileInfo}>
            <CheckIcon />
            <div>
              <div style={styles.fileName}>{file.name}</div>
              <div style={styles.fileMeta}>
                {(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; text/csv
              </div>
            </div>
            <button
              type="button"
              style={styles.clearBtn}
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        ) : (
          <div style={styles.placeholder}>
            <UploadIcon />
            <p style={styles.placeholderText}>
              Drag &amp; drop your CSV file here, or{' '}
              <span style={styles.browseLink}>click to browse</span>
            </p>
            <p style={styles.formatHint}>
              Expected columns: <code>Gene</code>, <code>Expression</code>
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>

      {/* Local validation error */}
      {localError && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
          <ExclamationIcon /> {localError}
        </div>
      )}

      {/* CSV format guide */}
      <div style={styles.formatGuide}>
        <h4 style={{ marginBottom: '0.4rem' }}>Expected CSV format</h4>
        <pre style={styles.code}>{TEMPLATE_PREVIEW}</pre>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={isLoading || !file}
        style={{ marginTop: '1rem' }}
      >
        {isLoading ? <><span className="spinner" /> Analysing…</> : '▶  Run Prediction'}
      </button>
    </form>
  );
}

// ── Preview constant ──────────────────────────────────────────────────────────
const TEMPLATE_PREVIEW = `Gene,Expression
IL6,8.2
TLR4,6.1
HLA-DRA,1.3
STAT3,4.5
TNF,7.8
CXCL8,5.2
…`;

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const UploadIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.75rem' }}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CheckIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const ExclamationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  templateRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    padding: '0.75rem 1rem',
    background: 'rgba(20,184,166,0.07)',
    border: '1px solid rgba(20,184,166,0.2)',
    borderRadius: '8px',
  },
  templateText: { fontSize: '0.85rem', color: '#94a3b8' },
  templateBtn: { fontSize: '0.8rem', padding: '0.35rem 0.85rem' },
  dropZone: {
    border: '2px dashed #334155',
    borderRadius: '12px',
    padding: '2rem',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    background: 'rgba(30,41,59,0.4)',
    minHeight: '140px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneActive: {
    borderColor: '#14b8a6',
    background: 'rgba(20,184,166,0.08)',
    boxShadow: '0 0 0 4px rgba(20,184,166,0.15)',
  },
  dropZoneSuccess: {
    borderColor: '#22c55e',
    borderStyle: 'solid',
    background: 'rgba(34,197,94,0.05)',
    cursor: 'default',
  },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  placeholderText: { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.35rem' },
  browseLink: { color: '#14b8a6', fontWeight: 600 },
  formatHint: { color: '#64748b', fontSize: '0.78rem' },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    width: '100%',
    justifyContent: 'center',
  },
  fileName: { color: '#e2e8f0', fontWeight: 600, fontSize: '0.95rem' },
  fileMeta: { color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' },
  clearBtn: {
    marginLeft: 'auto',
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatGuide: {
    marginTop: '1.25rem',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '1rem',
  },
  code: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.78rem',
    color: '#94a3b8',
    lineHeight: 1.7,
    whiteSpace: 'pre',
  },
};
