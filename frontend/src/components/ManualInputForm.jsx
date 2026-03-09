import React, { useState } from 'react';

const GENE_GROUPS = {
  'Pro-inflammatory': ['IL6', 'TLR4', 'TNF', 'CXCL8', 'MMP8', 'LBP'],
  'Regulatory / Protective': ['HLA-DRA', 'STAT3', 'CD14', 'PCSK9'],
};

const ALL_GENES = Object.values(GENE_GROUPS).flat();

const PRESETS = {
  'High-Risk Demo': {
    IL6: 9.1, TLR4: 7.3, 'HLA-DRA': 1.8, STAT3: 4.2, TNF: 8.6,
    CXCL8: 7.9, CD14: 2.3, MMP8: 8.1, LBP: 7.5, PCSK9: 1.2,
  },
  'Healthy Baseline': {
    IL6: 2.1, TLR4: 4.5, 'HLA-DRA': 6.8, STAT3: 5.0, TNF: 2.4,
    CXCL8: 2.8, CD14: 5.9, MMP8: 1.8, LBP: 4.1, PCSK9: 3.6,
  },
};

function emptyGenes() {
  return Object.fromEntries(ALL_GENES.map(g => [g, '']));
}

/**
 * ManualInputForm
 *
 * Props:
 *   onGenesChange({ [gene]: string }) — called on every input change
 *   values  — controlled gene values object
 *   errors  — { [gene]: string } field-level errors
 */
export default function ManualInputForm({ onGenesChange, values = {}, errors = {} }) {
  function handleChange(gene, val) {
    onGenesChange({ ...values, [gene]: val });
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    const next = { ...emptyGenes() };
    for (const g of ALL_GENES) next[g] = String(preset[g]);
    onGenesChange(next);
  }

  function handleClear() {
    onGenesChange(emptyGenes());
  }

  return (
    <div>
      {/* Preset buttons */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Presets:
        </span>
        {Object.keys(PRESETS).map(name => (
          <button
            key={name}
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => applyPreset(name)}
          >
            {name}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleClear}
          style={{ color: 'var(--color-text-dim)', marginLeft: 'auto' }}
        >
          ✕ Clear
        </button>
      </div>

      {/* Gene input groups */}
      {Object.entries(GENE_GROUPS).map(([groupName, genes]) => (
        <div key={groupName} style={{ marginBottom: '1.5rem' }}>
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            color: 'var(--color-text-muted)',
            marginBottom: '0.75rem',
            paddingBottom: '0.35rem',
            borderBottom: '1px solid var(--color-border)',
          }}>
            {groupName}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
            gap: '0.6rem',
          }}>
            {genes.map(gene => (
              <div key={gene}>
                <label style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: errors[gene] ? 'var(--color-risk-high)' : 'var(--color-navy)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: '0.25rem',
                  letterSpacing: '0.02em',
                }}>
                  <span>{gene}</span>
                  {errors[gene] && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-risk-high)', fontFamily: 'var(--font-sans)' }}>
                      {errors[gene]}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  max="20"
                  placeholder="0 – 20"
                  value={values[gene] ?? ''}
                  onChange={e => handleChange(gene, e.target.value)}
                  className={`form-input${errors[gene] ? ' error' : ''}`}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    textAlign: 'right',
                    paddingRight: '0.5rem',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Range note */}
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '-0.25rem' }}>
        Enter log₂-normalized expression values in range 0 – 20.
      </p>
    </div>
  );
}

export { emptyGenes, ALL_GENES };
