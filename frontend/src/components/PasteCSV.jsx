import React, { useState } from 'react';

const PLACEHOLDER = `SampleID,V1,V2,V3,V4,V5
SAMPLE_001,7.231,-1.031,0.448,5.102,2.778`;

/**
 * Parses a wide CSV text (header + one sample row) into a { feature: value } map.
 * Returns { features: {}, errors: [] }
 */
function parseCSVText(text) {
  const errors = [];
  const features = {};
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    errors.push('CSV must include a header row and one sample data row.');
    return { features, errors };
  }

  if (lines.length > 2) {
    errors.push('Only one sample row is supported per prediction.');
  }

  const header = lines[0].split(',').map((h) => h.trim());
  const row = (lines[1] || '').split(',').map((v) => v.trim());

  if (row.length !== header.length) {
    errors.push(
      `Header has ${header.length} column(s) but data row has ${row.length} value(s).`
    );
    return { features, errors };
  }

  const featureColumns = header.filter((column) => /^V\d+$/i.test(column));
  if (featureColumns.length === 0) {
    errors.push('No V-feature columns detected (expected columns like V1, V2, V3...).');
    return { features, errors };
  }

  for (let idx = 0; idx < header.length; idx += 1) {
    const column = header[idx];
    if (!/^V\d+$/i.test(column)) continue;

    const raw = row[idx];
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      errors.push(`Column ${column}: value "${raw}" is not numeric.`);
      continue;
    }
    features[column] = value;
  }

  return { features, errors };
}

/**
 * PasteCSV — textarea for pasting raw CSV data, with live parse preview.
 *
 * Props:
 *   onFeaturesChange({ [feature]: number }) — called when a valid parse succeeds
 *   onClearFeatures()                      — called when pasted text is cleared
 */
export default function PasteCSV({ onFeaturesChange, onClearFeatures }) {
  const [text, setText]     = useState('');
  const [parsed, setParsed] = useState(null); // { features, errors } | null
  const [hasRun, setHasRun] = useState(false);

  function handleParse() {
    if (!text.trim()) return;
    const result = parseCSVText(text);
    setParsed(result);
    setHasRun(true);
    if (!result.errors.length) {
      onFeaturesChange(result.features);
    } else {
      onClearFeatures?.();
    }
  }

  function handleClear() {
    setText('');
    setParsed(null);
    setHasRun(false);
    onClearFeatures?.();
  }

  const isValid = hasRun && parsed && !parsed.errors.length;

  return (
    <div>
      {/* Instruction banner */}
      <div style={{
        background: 'var(--color-accent-lt)',
        border: '1px solid #bfdbfe',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
        marginBottom: '1rem',
        fontSize: '0.82rem',
        color: 'var(--color-navy)',
      }}>
        Paste a wide GEO-style CSV with one sample row and feature columns like V1, V2, V3, ...
      </div>

      {/* Textarea */}
      <textarea
        className="form-input"
        rows={12}
        value={text}
        onChange={e => { setText(e.target.value); setHasRun(false); onClearFeatures?.(); }}
        placeholder={PLACEHOLDER}
        spellCheck={false}
        style={{ minHeight: 220 }}
      />

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-accent"
          onClick={handleParse}
          disabled={!text.trim()}
        >
          ▶ Parse CSV
        </button>
        {text && (
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Parse result */}
      {hasRun && parsed && (
        <div style={{ marginTop: '1rem' }}>
          {parsed.errors.length > 0 ? (
            <div className="alert alert-error">
              <div>
                <strong>Parse errors:</strong>
                <ul>
                  {parsed.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="alert alert-success">
              <div>
                <strong>✓ {Object.keys(parsed.features).length} features parsed successfully</strong>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {Object.entries(parsed.features).slice(0, 12).map(([g, v]) => (
                    <span key={g} style={{
                      background: 'rgba(22,163,74,0.08)',
                      border: '1px solid rgba(22,163,74,0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.15em 0.55em',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-risk-low)',
                    }}>
                      {g}: {v.toFixed(3)}
                    </span>
                  ))}
                </div>
                {Object.keys(parsed.features).length > 12 && (
                  <p style={{ marginTop: '0.6rem', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                    Showing first 12 features only.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
