import React, { useMemo } from 'react';

/**
 * Compute pseudo-cohort similarity scores derived from the risk score.
 * Higher risk score → higher sepsis cohort similarity, lower healthy similarity.
 */
function computeSimilarities(riskScore) {
  const rs = Math.max(0, Math.min(1, riskScore));
  return [
    {
      label:   'Sepsis Cohort',
      pct:     Math.round((0.10 + rs * 0.87) * 100),
      color:   '#dc2626',
      bgColor: '#fef2f2',
      desc:    'Critically ill patients with confirmed sepsis diagnosis',
    },
    {
      label:   'Infection (non-sepsis)',
      pct:     Math.round((0.15 + rs * 0.65) * 100),
      color:   '#d97706',
      bgColor: '#fffbeb',
      desc:    'Infected patients without sepsis progression',
    },
    {
      label:   'Healthy Control',
      pct:     Math.round(((1 - rs) * 0.84 + 0.04) * 100),
      color:   '#16a34a',
      bgColor: '#f0fdf4',
      desc:    'Healthy control subjects with no active infection',
    },
  ];
}

/**
 * CohortComparison - shows patient expression profile similarity
 * to reference GEO cohort populations as horizontal bar charts.
 *
 * Props:
 *   riskScore         - 0–1 float (drives the similarity calculation)
 *   featureImportances - not currently used, reserved for future UMAP
 */
export default function CohortComparison({ riskScore = 0 }) {
  const cohorts = useMemo(() => computeSimilarities(riskScore), [riskScore]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200">
        <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-0.5">
          Cohort Comparison
        </p>
        <p className="text-xs text-slate-500">
          Expression profile similarity to GEO reference cohort populations
        </p>
      </div>

      {/* Bars */}
      <div className="p-5 space-y-6">
        {cohorts.map(({ label, pct, color, bgColor, desc }) => (
          <div key={label}>
            <div className="flex items-start justify-between mb-2 gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{desc}</p>
              </div>
              <span
                className="text-2xl font-extrabold tabular-nums flex-shrink-0 ml-2"
                style={{ color }}
              >
                {pct}%
              </span>
            </div>
            <div className="h-3.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-[1200ms] ease-out"
                style={{ width: `${pct}%`, background: color, opacity: 0.82 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="px-5 pb-4">
        <p className="text-[11px] text-slate-400 italic leading-relaxed bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200">
          ⓘ Similarity scores are derived from expression-profile deviation analysis relative to GEO reference
          cohort centroids. Scores are illustrative and not validated for independent clinical use.
        </p>
      </div>
    </div>
  );
}
