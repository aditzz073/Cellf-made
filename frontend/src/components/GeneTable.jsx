import React, { useState } from 'react';

const DIRECTION_META = {
  up:   { label: '↑ Risk',     color: 'var(--color-risk-high)', bg: 'var(--color-risk-high-bg)' },
  down: { label: '↓ Protect',  color: 'var(--color-risk-low)',  bg: 'var(--color-risk-low-bg)' },
  neutral: { label: '—',       color: 'var(--color-text-muted)', bg: 'transparent' },
};

function directionOf(impact) {
  if (impact > 0.01)  return 'up';
  if (impact < -0.01) return 'down';
  return 'neutral';
}

/**
 * GeneTable — feature importance table derived from /explain response.
 *
 * Props:
 *   featureImportances — array of { gene, impact, expression, baseline }
 */
export default function GeneTable({ featureImportances = [] }) {
  const [sortKey, setSortKey] = useState('absImpact');
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const rows = featureImportances
    .map((f, i) => ({
      rank: i + 1,
      gene: f.gene,
      impact: f.impact,
      absImpact: Math.abs(f.impact ?? 0),
      expression: f.expression,
      baseline: f.baseline,
      delta: ((f.expression ?? 0) - (f.baseline ?? 0)),
      direction: directionOf(f.impact ?? 0),
    }))
    .sort((a, b) => {
      const v = (a[sortKey] ?? 0) - (b[sortKey] ?? 0);
      return sortAsc ? v : -v;
    });

  const maxAbs = Math.max(...rows.map(r => r.absImpact), 0.001);

  function SortBtn({ col, label }) {
    const active = sortKey === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontWeight: active ? 700 : 600,
          color: active ? 'var(--color-accent)' : 'var(--color-text-muted)',
          fontSize: '0.73rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: 0,
        }}
      >
        {label}{active ? (sortAsc ? ' ↑' : ' ↓') : ''}
      </button>
    );
  }

  return (
    <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>Gene Feature Importances</h3>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ width: 48 }}>#</th>
              <th><SortBtn col="gene" label="Gene" /></th>
              <th><SortBtn col="expression" label="Expression" /></th>
              <th><SortBtn col="baseline" label="Baseline" /></th>
              <th><SortBtn col="delta" label="Δ Expr." /></th>
              <th><SortBtn col="absImpact" label="Impact" /></th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const meta = DIRECTION_META[row.direction];
              const barW = `${(row.absImpact / maxAbs) * 100}%`;
              const deltaStr = (row.delta >= 0 ? '+' : '') + row.delta.toFixed(2);

              return (
                <tr key={row.gene}>
                  <td style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem', textAlign: 'center' }}>
                    {row.rank}
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'var(--color-navy)',
                    }}>
                      {row.gene}
                    </span>
                  </td>
                  <td className="mono">{(row.expression ?? 0).toFixed(2)}</td>
                  <td className="mono" style={{ color: 'var(--color-text-muted)' }}>
                    {(row.baseline ?? 0).toFixed(2)}
                  </td>
                  <td className="mono" style={{
                    color: row.delta > 0 ? 'var(--color-risk-high)' : row.delta < 0 ? 'var(--color-risk-low)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}>
                    {deltaStr}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        flex: 1,
                        height: 6,
                        background: 'var(--color-border)',
                        borderRadius: '999px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: barW,
                          height: '100%',
                          background: row.direction === 'up' ? 'var(--color-risk-high)'
                            : row.direction === 'down' ? 'var(--color-risk-low)'
                              : 'var(--color-text-dim)',
                          borderRadius: '999px',
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', minWidth: 38, textAlign: 'right' }}>
                        {row.impact >= 0 ? '+' : ''}{row.impact.toFixed(3)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: meta.color,
                      background: meta.bg,
                      padding: '0.2em 0.55em',
                      borderRadius: '999px',
                      border: `1px solid ${meta.color}33`,
                    }}>
                      {meta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
