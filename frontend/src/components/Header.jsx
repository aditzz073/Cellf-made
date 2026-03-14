/**
 * components/Header.jsx
 * Top navigation bar with SepsisAI branding and status ribbon.
 */

import React from 'react';

export default function Header() {
  return (
    <header style={styles.header}>
      <div className="page-container" style={styles.inner}>
        {/* Branding */}
        <div style={styles.brand}>
          <img src="/dna.png" alt="SepsisAI" style={styles.brandIcon} />
          <div>
            <span style={styles.brandName}>SepsisAI</span>
            <span style={styles.brandTag}>Gene Expression Risk Prediction</span>
          </div>
        </div>

        {/* Status pills */}
        <div style={styles.pills}>
          <span style={{ ...styles.pill, ...styles.pillResearch }}>
            <AlertIcon /> Research Use Only
          </span>
          <span style={{ ...styles.pill, ...styles.pillVersion }}>v1.0</span>
          <a
            href="/api/docs"
            target="_blank"
            rel="noreferrer"
            style={{ ...styles.pill, ...styles.pillDocs }}
          >
            API Docs <ExternalLinkIcon />
          </a>
        </div>
      </div>

      {/* Disclaimer ribbon */}
      <div style={styles.ribbon}>
        This tool is intended for <strong>research and investigational use only</strong>.
        Not validated for clinical diagnostic decisions. Always consult a qualified clinician.
      </div>
    </header>
  );
}

const AlertIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3h7v7" />
    <path d="M10 14L21 3" />
    <path d="M21 14v7h-7" />
    <path d="M3 10V3h7" />
  </svg>
);

const styles = {
  header: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1a3a5c 100%)',
    borderBottom: '1px solid #1e4278',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.875rem 1.5rem',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  brandIcon: {
    width: '32px',
    height: '32px',
    objectFit: 'contain',
  },
  brandName: {
    display: 'block',
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#e2e8f0',
    letterSpacing: '-0.01em',
  },
  brandTag: {
    display: 'block',
    fontSize: '0.72rem',
    color: '#94a3b8',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontWeight: 500,
  },
  pills: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  pill: {
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.72rem',
    fontWeight: 600,
    letterSpacing: '0.03em',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  pillResearch: {
    background: 'rgba(245,158,11,0.15)',
    color: '#fcd34d',
    border: '1px solid rgba(245,158,11,0.4)',
  },
  pillVersion: {
    background: 'rgba(20,184,166,0.15)',
    color: '#5eead4',
    border: '1px solid rgba(20,184,166,0.35)',
  },
  pillDocs: {
    background: 'rgba(59,130,246,0.15)',
    color: '#93c5fd',
    border: '1px solid rgba(59,130,246,0.35)',
    cursor: 'pointer',
  },
  ribbon: {
    background: 'rgba(245,158,11,0.08)',
    borderTop: '1px solid rgba(245,158,11,0.2)',
    color: '#fbbf24',
    fontSize: '0.75rem',
    textAlign: 'center',
    padding: '0.35rem 1rem',
    letterSpacing: '0.01em',
  },
};
