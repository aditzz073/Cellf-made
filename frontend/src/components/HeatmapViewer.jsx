/**
 * components/HeatmapViewer.jsx
 * Displays the base-64 encoded heatmap PNG returned by the backend.
 */

import React, { useState } from 'react';

export default function HeatmapViewer({ imageBase64, isLoading }) {
  const [zoom, setZoom] = useState(false);

  if (isLoading) {
    return (
      <div style={styles.placeholder}>
        <div className="skeleton" style={{ width: '100%', height: '140px', borderRadius: '8px' }} />
        <p style={styles.loadingText}>Generating heatmap…</p>
      </div>
    );
  }

  if (!imageBase64) {
    return (
      <div style={styles.empty}>
        <HeatmapIcon />
        <p>Run a prediction to generate the expression heatmap.</p>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.toolbar}>
        <span style={styles.meta}>Patient vs Healthy Baseline · log₂ expression</span>
        <button
          type="button"
          className="btn btn-ghost"
          style={styles.zoomBtn}
          onClick={() => setZoom(true)}
          title="View full size"
        >
          ⊞ Expand
        </button>
      </div>

      <img
        src={`data:image/png;base64,${imageBase64}`}
        alt="Gene expression heatmap comparing patient to healthy baseline"
        style={styles.img}
        onClick={() => setZoom(true)}
      />

      {/* Zoom / lightbox overlay */}
      {zoom && (
        <div style={styles.overlay} onClick={() => setZoom(false)}>
          <div style={styles.overlayInner} onClick={(e) => e.stopPropagation()}>
            <button type="button" style={styles.closeBtn} onClick={() => setZoom(false)}>✕ Close</button>
            <img
              src={`data:image/png;base64,${imageBase64}`}
              alt="Gene expression heatmap (full size)"
              style={styles.imgFull}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const HeatmapIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const styles = {
  wrapper: { width: '100%' },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.6rem',
  },
  meta: { fontSize: '0.75rem', color: '#64748b' },
  zoomBtn: { fontSize: '0.75rem', padding: '0.25rem 0.65rem' },
  img: {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #1e293b',
    cursor: 'zoom-in',
    display: 'block',
  },
  placeholder: { display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' },
  loadingText: { fontSize: '0.8rem', color: '#64748b', margin: 0 },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '1.5rem',
    color: '#475569',
    fontSize: '0.85rem',
    textAlign: 'center',
    background: '#0f172a',
    borderRadius: '8px',
    border: '1px dashed #1e293b',
  },
  // Lightbox
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  overlayInner: {
    position: 'relative',
    maxWidth: '95vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  closeBtn: {
    alignSelf: 'flex-end',
    background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.4)',
    color: '#f87171',
    borderRadius: '6px',
    padding: '0.35rem 0.85rem',
    cursor: 'pointer',
    fontSize: '0.82rem',
    fontFamily: 'Inter, sans-serif',
  },
  imgFull: {
    maxWidth: '100%',
    maxHeight: '80vh',
    borderRadius: '8px',
    objectFit: 'contain',
  },
};
