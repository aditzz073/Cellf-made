import React, { useState } from 'react';

const REQUIRED_GENES = ['IL6', 'TLR4', 'HLA-DRA', 'STAT3', 'TNF', 'CXCL8', 'CD14', 'MMP8', 'LBP', 'PCSK9'];

const PLACEHOLDER = `Gene,Expression
IL6,9.1
TLR4,7.3
HLA-DRA,1.8
STAT3,4.2
TNF,8.6
CXCL8,7.9
CD14,2.3
MMP8,8.1
LBP,7.5
PCSK9,1.2`;

/**
 * Parses a two-column CSV text (Gene,Expression) into a { gene: value } map.
 * Returns { genes: {}, errors: [] }
 */
function parseCSVText(text) {
  const errors = [];
  const genes = {};
  const lines = text.trim().split(/\r?\n/);
  const start = lines[0]?.toLowerCase().includes('gene') ? 1 : 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 2) {
      errors.push(`Line ${i + 1}: expected two comma-separated values`);
      continue;
    }
    const gene = parts[0].trim();
    const val  = parseFloat(parts[1].trim());
    if (!gene) { errors.push(`Line ${i + 1}: empty gene name`); continue; }
    if (isNaN(val)) { errors.push(`Line ${i + 1}: "${parts[1]}" is not a number`); continue; }
    if (val < 0 || val > 20) { errors.push(`Line ${i + 1}: value ${val} out of range [0, 20]`); continue; }
    genes[gene] = val;
  }

  const missing = REQUIRED_GENES.filter(g => !(g in genes));
  if (missing.length) errors.push(`Missing required genes: ${missing.join(', ')}`);

  return { genes, errors };
}

/**
 * PasteCSV — textarea for pasting raw CSV data, with live parse preview.
 *
 * Props:
 *   onGenesChange({ [gene]: number }) — called when a valid parse succeeds
 *   onClearGenes()                    — called when pasted text is cleared
 */
export default function PasteCSV({ onGenesChange, onClearGenes }) {
  const [text, setText]     = useState('');
  const [parsed, setParsed] = useState(null); // { genes, errors } | null
  const [hasRun, setHasRun] = useState(false);

  function handleParse() {
    if (!text.trim()) return;
    const result = parseCSVText(text);
    setParsed(result);
    setHasRun(true);
    if (!result.errors.length) {
      onGenesChange(result.genes);
    } else {
      onClearGenes?.();
    }
  }

  function handleClear() {
    setText('');
    setParsed(null);
    setHasRun(false);
    onClearGenes?.();
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
        Paste a CSV with two columns: <code style={{ fontSize: '0.78rem' }}>Gene</code> and <code style={{ fontSize: '0.78rem' }}>Expression</code>.
        The header row is optional.
      </div>

      {/* Textarea */}
      <textarea
        className="form-input"
        rows={12}
        value={text}
        onChange={e => { setText(e.target.value); setHasRun(false); onClearGenes?.(); }}
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
                <strong>✓ {Object.keys(parsed.genes).length} genes parsed successfully</strong>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {Object.entries(parsed.genes).map(([g, v]) => (
                    <span key={g} style={{
                      background: 'rgba(22,163,74,0.08)',
                      border: '1px solid rgba(22,163,74,0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.15em 0.55em',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--color-risk-low)',
                    }}>
                      {g}: {v.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
