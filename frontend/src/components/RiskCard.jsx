import React from 'react';

const RISK_META = {
  High:     { color: 'var(--color-risk-high)',   bg: 'var(--color-risk-high-bg)', border: 'var(--color-risk-high-bd)', emoji: '🔴', barColor: '#dc2626' },
  Moderate: { color: 'var(--color-risk-mod)',    bg: 'var(--color-risk-mod-bg)',  border: 'var(--color-risk-mod-bd)',  emoji: '🟡', barColor: '#d97706' },
  Low:      { color: 'var(--color-risk-low)',    bg: 'var(--color-risk-low-bg)',  border: 'var(--color-risk-low-bd)',  emoji: '🟢', barColor: '#16a34a' },
};

/**
 * RiskCard — displays the primary sepsis risk score prominently.
 *
 * Props:
 *   riskScore   — 0–1 float
 *   riskLevel   — "High" | "Moderate" | "Low"
 *   confidence  — 0–1 float (optional)
 *   modelType   — string (optional, displayed as footnote)
 */
export default function RiskCard({ riskScore, riskLevel, confidence, modelType }) {
  const meta = RISK_META[riskLevel] ?? RISK_META.Moderate;
  const pct = Math.round((riskScore ?? 0) * 100);
  const confPct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <div className="card fade-in" style={{
      background: meta.bg,
      border: `2px solid ${meta.border}`,
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background watermark */}
      <div style={{
        position: 'absolute',
        right: '-12px',
        bottom: '-12px',
        fontSize: '7rem',
        opacity: 0.08,
        pointerEvents: 'none',
        userSelect: 'none',
        lineHeight: 1,
      }}>
        {meta.emoji}
      </div>

      {/* Section label */}
      <div className="card-title" style={{ justifyContent: 'center', color: meta.color }}>
        Sepsis Risk Score
      </div>

      {/* Numeric score */}
      <div style={{
        fontSize: 'clamp(3.5rem, 8vw, 5rem)',
        fontWeight: 800,
        color: meta.color,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        marginBottom: '0.2rem',
      }}>
        {pct}<span style={{ fontSize: '2rem', fontWeight: 600, opacity: 0.7 }}>%</span>
      </div>

      <div style={{
        fontSize: '0.75rem',
        color: meta.color,
        opacity: 0.65,
        marginBottom: '1rem',
        fontWeight: 500,
        letterSpacing: '0.03em',
      }}>
        (score: {(riskScore ?? 0).toFixed(3)})
      </div>

      {/* Risk level badge */}
      <div style={{ marginBottom: '1.25rem' }}>
        <span className={`badge badge-${riskLevel.toLowerCase()}`} style={{ fontSize: '0.82rem', padding: '0.3em 0.9em' }}>
          {meta.emoji} {riskLevel} Risk
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: confPct != null ? '1.25rem' : '0' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          marginBottom: '0.35rem',
        }}>
          <span>Risk Level</span>
          <span style={{ color: meta.color, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${meta.barColor}aa, ${meta.barColor})`,
            }}
          />
        </div>
      </div>

      {/* Confidence */}
      {confPct != null && (
        <div style={{
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(255,255,255,0.9)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            marginBottom: '0.3rem',
          }}>
            <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>Model Confidence</span>
            <span style={{ color: 'var(--color-navy)', fontWeight: 700 }}>{confPct}%</span>
          </div>
          <div className="progress-bar" style={{ height: 5 }}>
            <div
              className="progress-fill"
              style={{
                width: `${confPct}%`,
                background: 'linear-gradient(90deg, #93c5fd, var(--color-navy))',
              }}
            />
          </div>
          {modelType && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--color-text-dim)',
              marginTop: '0.5rem',
              textAlign: 'center',
            }}>
              {modelType}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
