/**
 * components/ManualInput.jsx
 * Form for manually entering gene expression values.
 * Gene panel is defined locally; values are validated client-side
 * before being passed up as a { [gene]: number } dictionary.
 */

import React, { useState } from 'react';

// Ordered gene panel with metadata for rendering
const GENE_PANEL = [
  { symbol: 'IL6',     name: 'Interleukin-6',                     role: 'risk',      hint: '0 – 12' },
  { symbol: 'TLR4',    name: 'Toll-like receptor 4',               role: 'risk',      hint: '0 – 12' },
  { symbol: 'TNF',     name: 'Tumour necrosis factor',             role: 'risk',      hint: '0 – 12' },
  { symbol: 'CXCL8',   name: 'C-X-C motif chemokine ligand 8',    role: 'risk',      hint: '0 – 12' },
  { symbol: 'MMP8',    name: 'Matrix metalloproteinase-8',         role: 'risk',      hint: '0 – 12' },
  { symbol: 'LBP',     name: 'LPS-binding protein',                role: 'risk',      hint: '0 – 12' },
  { symbol: 'PCSK9',   name: 'Proprotein convertase subtilisin 9', role: 'risk',      hint: '0 – 12' },
  { symbol: 'HLA-DRA', name: 'HLA class II DR alpha',              role: 'protective', hint: '0 – 12' },
  { symbol: 'STAT3',   name: 'Signal transducer / activator 3',   role: 'protective', hint: '0 – 12' },
  { symbol: 'CD14',    name: 'Monocyte differentiation antigen',   role: 'protective', hint: '0 – 12' },
];

const DEMO_VALUES = {
  IL6: 8.2, TLR4: 6.1, 'HLA-DRA': 1.3, STAT3: 4.5, TNF: 7.8,
  CXCL8: 5.2, CD14: 3.9, MMP8: 6.4, LBP: 5.1, PCSK9: 2.3,
};

const HEALTHY_VALUES = {
  IL6: 2.1, TLR4: 4.5, 'HLA-DRA': 6.8, STAT3: 5.0, TNF: 2.4,
  CXCL8: 2.8, CD14: 5.9, MMP8: 1.8, LBP: 4.1, PCSK9: 3.6,
};

function initEmpty() {
  return Object.fromEntries(GENE_PANEL.map((g) => [g.symbol, '']));
}

export default function ManualInput({ onSubmit, isLoading }) {
  const [values, setValues] = useState(initEmpty);
  const [errors, setErrors] = useState({});
  const [patientId, setPatientId] = useState('');

  // ── Field change ──────────────────────────────────────────────────────────
  const handleChange = (symbol, rawVal) => {
    setValues((prev) => ({ ...prev, [symbol]: rawVal }));
    if (errors[symbol]) {
      setErrors((prev) => { const n = { ...prev }; delete n[symbol]; return n; });
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    GENE_PANEL.forEach(({ symbol }) => {
      const raw = values[symbol];
      if (raw === '' || raw === null || raw === undefined) {
        newErrors[symbol] = 'Required';
        return;
      }
      const num = parseFloat(raw);
      if (isNaN(num)) { newErrors[symbol] = 'Must be a number'; return; }
      if (num < 0 || num > 20) { newErrors[symbol] = 'Range: 0–20 (log₂)'; }
    });
    return newErrors;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    const genes = {};
    GENE_PANEL.forEach(({ symbol }) => { genes[symbol] = parseFloat(values[symbol]); });
    onSubmit(genes, patientId || 'ANONYMOUS');
  };

  const loadPreset = (preset) => {
    setValues(Object.fromEntries(GENE_PANEL.map((g) => [g.symbol, String(preset[g.symbol] ?? '')])));
    setErrors({});
  };

  const handleClear = () => { setValues(initEmpty()); setErrors({}); };

  const riskGenes      = GENE_PANEL.filter((g) => g.role === 'risk');
  const protectGenes   = GENE_PANEL.filter((g) => g.role === 'protective');

  return (
    <form onSubmit={handleSubmit}>
      {/* Patient ID */}
      <div className="form-group">
        <label className="form-label">Patient / Sample ID (optional)</label>
        <input
          className="form-input"
          type="text"
          placeholder="e.g. PT-00421"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          maxLength={64}
        />
      </div>

      {/* Preset buttons */}
      <div style={styles.presets}>
        <span style={styles.presetsLabel}>Load preset:</span>
        <button type="button" className="btn btn-secondary" style={styles.presetBtn} onClick={() => loadPreset(DEMO_VALUES)}>
          High-Risk Demo
        </button>
        <button type="button" className="btn btn-secondary" style={styles.presetBtn} onClick={() => loadPreset(HEALTHY_VALUES)}>
          Healthy Baseline
        </button>
        <button type="button" className="btn btn-secondary" style={styles.presetBtn} onClick={handleClear}>
          Clear All
        </button>
      </div>

      {/* Pro-inflammatory gene inputs */}
      <GeneGroup
        title="Pro-inflammatory / Risk Markers"
        titleColor="#ef4444"
        genes={riskGenes}
        values={values}
        errors={errors}
        onChange={handleChange}
      />

      {/* Protective gene inputs */}
      <GeneGroup
        title="Immune Regulation / Protective Markers"
        titleColor="#22c55e"
        genes={protectGenes}
        values={values}
        errors={errors}
        onChange={handleChange}
      />

      {/* Global error count */}
      {Object.keys(errors).length > 0 && (
        <div className="alert alert-error" style={{ marginBottom: '0.75rem' }}>
          <span>⚠</span>
          Please correct <strong>{Object.keys(errors).length}</strong> field error(s) before submitting.
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary btn-full"
        disabled={isLoading}
      >
        {isLoading ? <><span className="spinner" /> Analysing…</> : '▶  Run Prediction'}
      </button>
    </form>
  );
}

// ── GeneGroup sub-component ───────────────────────────────────────────────────
function GeneGroup({ title, titleColor, genes, values, errors, onChange }) {
  return (
    <div style={styles.group}>
      <div style={{ ...styles.groupTitle, color: titleColor }}>
        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: titleColor, display: 'inline-block', marginRight: '0.5rem' }} />
        {title}
      </div>
      <div style={styles.grid}>
        {genes.map(({ symbol, name, hint }) => (
          <div key={symbol} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.2rem' }}>
              <span style={styles.geneSymbol}>{symbol}</span>
              <span style={styles.geneName}>{name}</span>
            </label>
            <input
              className={`form-input${errors[symbol] ? ' error' : ''}`}
              type="number"
              step="0.01"
              min="0"
              max="20"
              placeholder={hint}
              value={values[symbol]}
              onChange={(e) => onChange(symbol, e.target.value)}
            />
            {errors[symbol] && (
              <span style={styles.fieldError}>{errors[symbol]}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  presets: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.25rem',
    flexWrap: 'wrap',
  },
  presetsLabel: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    marginRight: '0.25rem',
  },
  presetBtn: { fontSize: '0.78rem', padding: '0.35rem 0.75rem' },
  group: {
    marginBottom: '1.25rem',
    background: 'rgba(15,23,42,0.4)',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '1rem',
  },
  groupTitle: {
    fontSize: '0.78rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '0.85rem',
    display: 'flex',
    alignItems: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '0.75rem',
  },
  geneSymbol: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    color: '#e2e8f0',
    display: 'block',
  },
  geneName: {
    color: '#64748b',
    fontSize: '0.68rem',
    fontFamily: 'Inter, sans-serif',
    display: 'block',
    fontWeight: 400,
    lineHeight: 1.3,
  },
  fieldError: {
    color: '#f87171',
    fontSize: '0.72rem',
    marginTop: '0.2rem',
    display: 'block',
  },
};
