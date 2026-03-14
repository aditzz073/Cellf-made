import React from 'react';

const RISK_META = {
  High:     { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', badge: '#dc2626', label: 'HIGH RISK' },
  Moderate: { color: '#d97706', bg: '#fffbeb', border: '#fed7aa', badge: '#d97706', label: 'MODERATE RISK' },
  Low:      { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', badge: '#16a34a', label: 'LOW RISK' },
};

/**
 * RiskCard - primary sepsis risk score display.
 *
 * Props:
 *   riskScore   - 0–1 float
 *   riskLevel   - "High" | "Moderate" | "Low"
 *   confidence  - 0–1 float (optional)
 *   modelType   - string (optional)
 */
export default function RiskCard({ riskScore, riskLevel, confidence, modelType }) {
  const meta = RISK_META[riskLevel] ?? RISK_META.Moderate;
  const pct  = Math.round((riskScore ?? 0) * 100);
  const confPct = confidence != null ? Math.round(confidence * 100) : null;
  const isPlaceholder = (modelType || '').toLowerCase().includes('placeholder');

  return (
    <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: meta.border }}>

      {/* ── Colored risk section ── */}
      <div
        className="p-6 flex flex-col gap-4 relative"
        style={{ background: meta.bg }}
      >
        {/* Watermark */}
        <div
          className="absolute -right-6 -bottom-6 pointer-events-none"
          style={{
            width: 130,
            height: 130,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${meta.color}22, ${meta.color}10 60%, transparent 70%)`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 22,
              borderRadius: '50%',
              border: `2px solid ${meta.color}22`,
            }}
          />
        </div>

        {/* Label */}
        <p className="text-[10px] font-bold tracking-widest uppercase text-center" style={{ color: meta.color }}>
          Sepsis Risk Score
        </p>

        {/* Big score */}
        <div className="text-center">
          <div className="text-7xl font-extrabold leading-none tabular-nums" style={{ color: meta.color }}>
            {pct}<span className="text-3xl font-bold opacity-50">%</span>
          </div>
          <p className="text-xs font-mono mt-1.5 opacity-60" style={{ color: meta.color }}>
            score: {(riskScore ?? 0).toFixed(4)}
          </p>
        </div>

        {/* Risk badge */}
        <div className="flex justify-center">
          <span
            className="px-5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-white shadow-sm"
            style={{ background: meta.badge }}
          >
            {meta.label}
          </span>
        </div>

        {/* Risk bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5 font-medium" style={{ color: meta.color }}>
            <span className="opacity-60">Risk Level</span>
            <span>{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.55)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${meta.color}88, ${meta.color})` }}
            />
          </div>
        </div>
      </div>

      {/* ── Confidence section - clean white area below colored band ── */}
      {confPct != null && (
        <div className="bg-white px-6 py-4 flex flex-col gap-3" style={{ borderTop: `2px solid ${meta.border}` }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-600">Model Confidence</span>
            <span className="text-sm font-bold font-mono text-navy-700">{confPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${confPct}%`, background: 'linear-gradient(90deg, #93c5fd, #1d4ed8)' }}
            />
          </div>
          {modelType && (
            <p className="text-[11px] text-slate-400 text-center">{modelType}</p>
          )}
          {isPlaceholder && (
            <p className="text-[11px] text-slate-500 italic leading-relaxed text-center">
              ⓘ Confidence reflects internal scoring consistency, not a calibrated clinical probability.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
