/**
 * components/GeneImpactChart.jsx
 * Horizontal bar chart showing feature importances (SHAP-style display).
 * Positive bars = risk-increasing (red), negative = protective (green).
 */

import React from 'react';

const MAX_GENES = 10;

export default function GeneImpactChart({ impacts }) {
  if (!impacts || impacts.length === 0) return null;

  const displayed = impacts.slice(0, MAX_GENES);
  const maxAbs = Math.max(...displayed.map((d) => Math.abs(d.impact)), 0.01);

  return (
    <div style={styles.wrapper}>
      <div style={styles.legendRow}>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: '#ef4444' }} />
          Risk-increasing ↑
        </span>
        <span style={styles.legendItem}>
          <span style={{ ...styles.dot, background: '#22c55e' }} />
          Protective ↓
        </span>
      </div>

      <div style={styles.chart}>
        {displayed.map((item) => {
          const isPositive = item.impact >= 0;
          const pct = (Math.abs(item.impact) / maxAbs) * 100;
          const barColor = isPositive ? '#ef4444' : '#22c55e';
          const barGlow  = isPositive ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)';

          return (
            <div key={item.gene} style={styles.row}>
              {/* Gene label */}
              <div style={styles.label}>
                <span style={styles.geneSymbol}>{item.gene}</span>
                <span style={styles.exprLabel}>
                  {item.expression?.toFixed(1)} / {item.baseline?.toFixed(1)}
                </span>
              </div>

              {/* Bar track */}
              <div style={styles.track}>
                {isPositive ? (
                  <>
                    <div style={styles.leftHalf} />
                    <div
                      style={{
                        ...styles.bar,
                        width: `${pct / 2}%`,
                        background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                        boxShadow: `2px 0 8px ${barGlow}`,
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        ...styles.bar,
                        width: `${pct / 2}%`,
                        alignSelf: 'flex-end',
                        background: `linear-gradient(270deg, ${barColor}cc, ${barColor})`,
                        boxShadow: `-2px 0 8px ${barGlow}`,
                        marginLeft: 'auto',
                        borderRadius: '4px 0 0 4px',
                      }}
                    />
                    <div style={styles.rightHalf} />
                  </>
                )}
                {/* Centre spine */}
                <div style={styles.spine} />
              </div>

              {/* Impact value */}
              <div style={{ ...styles.value, color: barColor }}>
                {item.impact >= 0 ? '+' : ''}{item.impact.toFixed(4)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.axisLabels}>
        <span>← Protective</span>
        <span>0</span>
        <span>Risk-increasing →</span>
      </div>
    </div>
  );
}

const styles = {
  wrapper: { width: '100%' },
  legendRow: {
    display: 'flex',
    gap: '1.25rem',
    marginBottom: '0.85rem',
    fontSize: '0.78rem',
    color: '#94a3b8',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
  dot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  chart: { display: 'flex', flexDirection: 'column', gap: '0.45rem' },
  row: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr 72px',
    alignItems: 'center',
    gap: '0.6rem',
  },
  label: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  geneSymbol: {
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 600,
    fontSize: '0.82rem',
    color: '#e2e8f0',
  },
  exprLabel: {
    fontSize: '0.65rem',
    color: '#64748b',
    fontFamily: "'JetBrains Mono', monospace",
  },
  track: {
    height: '22px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    background: '#0f172a',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  leftHalf: { width: '50%', height: '100%', flexShrink: 0 },
  rightHalf: { width: '50%', height: '100%', flexShrink: 0 },
  bar: { height: '100%', transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' },
  spine: {
    position: 'absolute',
    left: '50%',
    top: '10%',
    bottom: '10%',
    width: '1px',
    background: '#334155',
    transform: 'translateX(-50%)',
  },
  value: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '0.75rem',
    fontWeight: 600,
    textAlign: 'right',
  },
  axisLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.68rem',
    color: '#475569',
    marginTop: '0.4rem',
    padding: '0 110px 0 0',
  },
};
