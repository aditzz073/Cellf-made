/**
 * pages/Home.jsx
 * Main page - two-column layout: input panel (left) + results panel (right).
 * Manages all application state and orchestrates API calls.
 */

import React, { useState } from 'react';
import CSVUpload from '../components/CSVUpload.jsx';
import ManualInput from '../components/ManualInput.jsx';
import ResultsPanel from '../components/ResultsPanel.jsx';
import { predictFromCSV, predictFromGenes } from '../api/client.js';

const TABS = [
  { id: 'csv', label: 'CSV Upload', Icon: CSVTabIcon },
  { id: 'manual', label: 'Manual Entry', Icon: ManualTabIcon },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('csv');
  const [results, setResults]     = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const [patientId, setPatientId] = useState('');

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCSVSubmit = async (file) => {
    setError(null);
    setIsLoading(true);
    setResults(null);
    try {
      const data = await predictFromCSV(file);
      setResults(data);
      setPatientId('');
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async (genes, pid) => {
    setError(null);
    setIsLoading(true);
    setResults(null);
    setPatientId(pid || '');
    try {
      const data = await predictFromGenes(genes);
      setResults(data);
    } catch (err) {
      setError(formatError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => { setResults(null); setError(null); setPatientId(''); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={styles.main}>
      <div className="page-container" style={styles.container}>

        {/* ── Page intro ── */}
        <div style={styles.intro}>
          <h1 style={styles.introTitle}>Sepsis Risk Assessment</h1>
          <p style={styles.introSub}>
            Upload a gene expression profile or enter values manually.  The model
            analyses a 10-gene sepsis panel and returns a risk score, feature
            importances, and a clinical report.
          </p>
          <div style={styles.geneBadges}>
            {['IL6','TLR4','HLA-DRA','STAT3','TNF','CXCL8','CD14','MMP8','LBP','PCSK9'].map((g) => (
              <span key={g} style={styles.geneBadge}>{g}</span>
            ))}
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div style={styles.grid}>

          {/* ── Left: Input panel ── */}
          <div style={styles.inputColumn}>
            <div className="card">
              <div className="card-title">
                <InputIcon /> Data Input
              </div>

              <div className="tabs">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
                    onClick={() => { setActiveTab(t.id); handleReset(); }}
                  >
                    <t.Icon /> {t.label}
                  </button>
                ))}
              </div>

              {activeTab === 'csv'
                ? <CSVUpload onSubmit={handleCSVSubmit} isLoading={isLoading} />
                : <ManualInput onSubmit={handleManualSubmit} isLoading={isLoading} />
              }
            </div>

            {/* Info boxes */}
            <InfoBox
              title="Gene Panel"
              text="The model uses a 10-gene sepsis panel including pro-inflammatory markers (IL6, TNF, TLR4, CXCL8, MMP8) and immune-regulatory markers (HLA-DRA, STAT3, CD14). Expression values should be log₂-transformed."
            />
            <InfoBox
              title="Model Status"
              text="Currently running in placeholder mode. The model applies a biology-informed weighted formula. Swap in a trained scikit-learn model by placing it at backend/models/sepsis_model.pkl."
              accent="#f59e0b"
            />
          </div>

          {/* ── Right: Results panel ── */}
          <div style={styles.resultsColumn}>
            <div className="card" style={styles.resultsCard}>
              {error && (
                <ErrorDisplay error={error} onDismiss={() => setError(null)} />
              )}
              <ResultsPanel
                results={results}
                isLoading={isLoading}
                patientId={patientId}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function ErrorDisplay({ error, onDismiss }) {
  const isValidation = error.validation_errors && Array.isArray(error.validation_errors);
  return (
    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
      <div style={{ flex: 1 }}>
        <strong>Error: </strong>{isValidation ? 'Validation failed' : (error.message || String(error))}
        {isValidation && (
          <ul>
            {error.validation_errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem', padding: 0 }}
      ><CloseIcon /></button>
    </div>
  );
}

function InfoBox({ title, text, accent = '#14b8a6' }) {
  return (
    <div style={{ ...styles.infoBox, borderColor: `${accent}33`, background: `${accent}08` }}>
      <div style={{ ...styles.infoTitle, color: accent }}><InfoIcon /> {title}</div>
      <p style={styles.infoText}>{text}</p>
    </div>
  );
}

// ── Error formatter ───────────────────────────────────────────────────────────
function formatError(err) {
  const resp = err?.response?.data;
  if (!resp) return { message: err.message || 'An unexpected error occurred.' };
  if (resp.detail?.validation_errors) return { validation_errors: resp.detail.validation_errors };
  if (typeof resp.detail === 'string') return { message: resp.detail };
  return { message: JSON.stringify(resp) };
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const InputIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const CSVTabIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const ManualTabIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4Z" />
  </svg>
);

const InfoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  main: { flex: 1, padding: '1.5rem 0 3rem' },
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  intro: {
    textAlign: 'center',
    padding: '0.5rem 0',
  },
  introTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #e2e8f0, #14b8a6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '0.5rem',
  },
  introSub: {
    color: '#64748b',
    fontSize: '0.9rem',
    maxWidth: '600px',
    margin: '0 auto 1rem',
    lineHeight: 1.7,
  },
  geneBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    justifyContent: 'center',
  },
  geneBadge: {
    background: 'rgba(20,184,166,0.1)',
    border: '1px solid rgba(20,184,166,0.25)',
    color: '#5eead4',
    padding: '0.2rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 500,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: '1.5rem',
    alignItems: 'flex-start',
  },
  inputColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    position: 'sticky',
    top: '85px',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
    paddingRight: '2px',
  },
  resultsColumn: { minWidth: 0 },
  resultsCard: { minHeight: '400px' },
  infoBox: {
    border: '1px solid',
    borderRadius: '10px',
    padding: '0.875rem 1rem',
  },
  infoTitle: {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '0.35rem',
  },
  infoText: { fontSize: '0.8rem', color: '#64748b', lineHeight: 1.65, margin: 0 },
};
