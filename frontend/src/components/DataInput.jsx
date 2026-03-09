import React, { useState } from 'react';
import CSVUpload from './CSVUpload.jsx';
import ManualInputForm, { emptyGenes, ALL_GENES } from './ManualInputForm.jsx';
import PasteCSV from './PasteCSV.jsx';

const REQUIRED_GENES = ['IL6', 'TLR4', 'HLA-DRA', 'STAT3', 'TNF', 'CXCL8', 'CD14', 'MMP8', 'LBP', 'PCSK9'];

const TABS = [
  { id: 'upload', label: '📂 Upload CSV' },
  { id: 'manual', label: '✏️ Manual Entry' },
  { id: 'paste',  label: '📋 Paste CSV' },
];

/**
 * DataInput — three-tab data input page.
 *
 * Props:
 *   onSubmit({ type: 'file'|'genes', data: File|{}, patientId: string }) — triggers analysis
 *   onBack() — navigates back to landing
 */
export default function DataInput({ onSubmit, onBack, externalError, onClearError }) {
  const [tab, setTab]             = useState('upload');
  const [patientId, setPatientId] = useState('');
  const [selectedFile, setSelectedFile]   = useState(null);
  const [manualValues, setManualValues]   = useState(emptyGenes());
  const [pastedGenes, setPastedGenes]     = useState(null);
  const [fieldErrors, setFieldErrors]     = useState({});
  const [submitError, setSubmitError]     = useState('');

  /* ── Validation helpers ─────────────────────────────────────── */
  function validateManual(vals) {
    const errs = {};
    for (const gene of REQUIRED_GENES) {
      const raw = vals[gene];
      if (raw === '' || raw == null) { errs[gene] = 'required'; continue; }
      const n = parseFloat(raw);
      if (isNaN(n))        { errs[gene] = 'not a number'; continue; }
      if (n < 0 || n > 20) { errs[gene] = '0–20'; }
    }
    return errs;
  }

  /* ── Submit ─────────────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    if (tab === 'upload') {
      if (!selectedFile) {
        setSubmitError('Please select a CSV file.');
        return;
      }
      onSubmit({ type: 'file', data: selectedFile, patientId });
      return;
    }

    if (tab === 'manual') {
      const errs = validateManual(manualValues);
      if (Object.keys(errs).length) {
        setFieldErrors(errs);
        setSubmitError('Please fill in all gene values within the valid range (0–20).');
        return;
      }
      const genes = Object.fromEntries(
        REQUIRED_GENES.map(g => [g, parseFloat(manualValues[g])])
      );
      onSubmit({ type: 'genes', data: genes, patientId });
      return;
    }

    if (tab === 'paste') {
      if (!pastedGenes || Object.keys(pastedGenes).length === 0) {
        setSubmitError('Please paste and parse your CSV data first.');
        return;
      }
      const missing = REQUIRED_GENES.filter(g => !(g in pastedGenes));
      if (missing.length) {
        setSubmitError(`Missing required genes: ${missing.join(', ')}`);
        return;
      }
      onSubmit({ type: 'genes', data: pastedGenes, patientId });
    }
  }

  function switchTab(id) {
    setTab(id);
    setSubmitError('');
    setFieldErrors({});
  }

  const isReady = (
    (tab === 'upload' && selectedFile != null) ||
    (tab === 'manual' && ALL_GENES.every(g => manualValues[g] !== '' && manualValues[g] != null)) ||
    (tab === 'paste'  && pastedGenes && Object.keys(pastedGenes).length >= 10)
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>
      {/* ── Top nav bar ─────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 1.5rem',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0',
            }}
          >
            ← Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧬</span>
            <span style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>SepsisAI</span>
          </div>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          New Analysis
        </span>
      </header>

      {/* ── Page body ───────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '2rem 1.5rem 3rem', maxWidth: 780, width: '100%', margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.3rem' }}>Gene Expression Input</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Provide 10-gene transcriptomic data for a patient sample using one of the methods below.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* ── Patient ID ────────────────────────────────── */}
          <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <label className="form-label" htmlFor="patient-id">Patient / Sample ID (optional)</label>
                <input
                  id="patient-id"
                  type="text"
                  className="form-input"
                  placeholder="e.g. PT-2024-001"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  maxLength={64}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div style={{
                flex: '1 1 auto',
                fontSize: '0.78rem',
                color: 'var(--color-text-dim)',
                paddingTop: '1.2rem',
                lineHeight: 1.55,
              }}>
                Used for labelling the PDF report. Anonymized if left blank.
              </div>
            </div>
          </div>

          {/* ── Input tabs ────────────────────────────────── */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div className="tabs">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`tab-btn${tab === t.id ? ' active' : ''}`}
                  onClick={() => switchTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {tab === 'upload' && (
              <CSVUpload
                onFileSelected={setSelectedFile}
                selectedFile={selectedFile}
              />
            )}
            {tab === 'manual' && (
              <ManualInputForm
                values={manualValues}
                errors={fieldErrors}
                onGenesChange={vals => { setManualValues(vals); setFieldErrors({}); }}
              />
            )}
            {tab === 'paste' && (
              <PasteCSV
                onGenesChange={g => { setPastedGenes(g); setSubmitError(''); }}
                onClearGenes={() => setPastedGenes(null)}
              />
            )}
          </div>

          {/* ── Submit area ───────────────────────────────── */}
          <div style={{ marginTop: '1.5rem' }}>
            {(submitError || externalError) && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                ⚠ {submitError || externalError}
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-full btn-lg"
              onClick={() => { if (externalError) onClearError?.(); }}>
              Run Sepsis Risk Analysis →
            </button>
            <p style={{
              textAlign: 'center',
              fontSize: '0.72rem',
              color: 'var(--color-text-dim)',
              marginTop: '0.6rem',
            }}>
              Analysis typically completes in under 5 seconds
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
