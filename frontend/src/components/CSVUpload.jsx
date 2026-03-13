/**
 * components/CSVUpload.jsx
 * Drag-and-drop + click-to-browse CSV upload panel (light medical theme).
 */

import React, { useState, useRef, useCallback } from 'react';
import { API } from '../services/api.js';

/**
 * CSVUpload
 *
 * Props:
 *   onFileSelected(file) — called when a valid file is chosen (does NOT auto-submit)
 *   selectedFile         — current File | null (controlled)
 */
export default function CSVUpload({ onFileSelected, selectedFile }) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const fileInputRef = useRef(null);

  const validateAndSet = useCallback((f) => {
    setLocalError('');
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setLocalError('Only .csv files are accepted.');
      onFileSelected(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setLocalError('File exceeds 10 MB limit.');
      onFileSelected(null);
      return;
    }
    onFileSelected(f);
  }, [onFileSelected]);

  const onDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };
  const onFileChange = (e) => validateAndSet(e.target.files?.[0]);

  const handleClear = () => {
    onFileSelected(null);
    setLocalError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      {/* Template row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--color-accent-lt)',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--color-navy)', fontWeight: 500 }}>
          Need the GEO wide-format template?
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => API.downloadTemplate()}
          style={{ color: 'var(--color-accent)', borderColor: '#93c5fd' }}
        >
          ↓ Download CSV Template
        </button>
      </div>

      {/* Drop zone */}
      <div
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-accent)' : selectedFile ? 'var(--color-risk-low)' : 'var(--color-border-d)'}`,
          borderRadius: 'var(--radius-lg)',
          background: dragOver
            ? 'var(--color-accent-lt)'
            : selectedFile
              ? 'var(--color-risk-low-bg)'
              : 'var(--color-surface-2)',
          padding: '2.5rem 1.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />

        {selectedFile ? (
          <div>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <p style={{
              fontWeight: 600,
              color: 'var(--color-risk-low)',
              fontSize: '0.95rem',
              marginBottom: '0.25rem',
            }}>
              {selectedFile.name}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
            >
              ✕ Remove file
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', opacity: 0.6 }}>📂</div>
            <p style={{ fontWeight: 600, color: 'var(--color-navy)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
              Drop your GEO expression CSV here
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
              one sample row with feature columns (V1...V24840)
            </p>
            <span style={{
              display: 'inline-block',
              fontSize: '0.72rem',
              color: 'var(--color-text-dim)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.2em 0.6em',
            }}>
              .csv · max 10 MB
            </span>
          </div>
        )}
      </div>

      {localError && (
        <div className="alert alert-error" style={{ marginTop: '0.75rem' }}>
          ⚠ {localError}
        </div>
      )}
    </div>
  );
}


