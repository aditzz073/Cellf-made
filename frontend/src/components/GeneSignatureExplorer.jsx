import React, { useState } from 'react';
import { REFERENCE_BASELINE } from '../constants.js';

const GENE_ROLES = {
  IL6:       { role: 'Pro-inflammatory cytokine',      fn: 'Fever & acute-phase response initiator',         dir: 'up' },
  TLR4:      { role: 'Pattern recognition receptor',   fn: 'Innate immune activation via LPS sensing',       dir: 'up' },
  'HLA-DRA': { role: 'MHC class II antigen',           fn: 'Antigen presentation / immune suppression',      dir: 'down' },
  STAT3:     { role: 'Signal transducer',              fn: 'Cytokine signaling & immune regulation',         dir: 'down' },
  TNF:       { role: 'Tumor necrosis factor',          fn: 'Inflammatory cascade initiation',                dir: 'up' },
  CXCL8:     { role: 'Chemokine (IL-8)',               fn: 'Neutrophil recruitment to infection site',       dir: 'up' },
  CD14:      { role: 'LPS co-receptor',                fn: 'Innate immune signal transduction',              dir: 'mixed' },
  MMP8:      { role: 'Matrix metalloprotease-8',       fn: 'Tissue remodeling & neutrophil degranulation',   dir: 'up' },
  LBP:       { role: 'LPS-binding protein',            fn: 'Innate immunity mediator',                       dir: 'up' },
  PCSK9:     { role: 'Proprotein convertase 9',        fn: 'LDL metabolism & innate immunity crosstalk',     dir: 'mixed' },
};

/**
 * GeneSignatureExplorer - cBioPortal-style gene table with
 * biological roles, fold change, and impact bars.
 *
 * Props:
 *   featureImportances - [{gene, impact, expression, baseline?}, ...]
 */
export default function GeneSignatureExplorer({ featureImportances }) {
  const [sortBy,  setSortBy]  = useState('impact');
  const [tooltip, setTooltip] = useState(null);

  if (!featureImportances?.length) return null;

  const enriched = featureImportances.map(f => ({
    ...f,
    baseline: f.baseline ?? REFERENCE_BASELINE[f.gene] ?? 0,
    meta: GENE_ROLES[f.gene] ?? { role: 'Unknown', fn: '-', dir: 'mixed' },
  }));

  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === 'impact')      return Math.abs(b.impact) - Math.abs(a.impact);
    if (sortBy === 'expression')  return b.expression - a.expression;
    if (sortBy === 'fold')        return (b.expression - b.baseline) - (a.expression - a.baseline);
    return 0;
  });

  const maxImpact = Math.max(...sorted.map(f => Math.abs(f.impact)), 0.001);

  function SortButton({ col, label }) {
    const active = sortBy === col;
    return (
      <button
        onClick={() => setSortBy(col)}
        className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
          active
            ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold'
            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-0.5">
            Gene Signature Explorer
          </p>
          <p className="text-xs text-slate-500">
            {sorted.length} genes &nbsp;·&nbsp;
            sorted by {sortBy === 'impact' ? 'impact score' : sortBy === 'expression' ? 'expression level' : 'fold change'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Sort:</span>
          <SortButton col="impact"     label="Impact" />
          <SortButton col="expression" label="Expression" />
          <SortButton col="fold"       label="Fold Δ" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['Gene', 'Expression', 'Baseline', 'Fold Δ', 'Biological Role', 'Impact Score'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((f) => {
              const fold = f.expression - f.baseline;
              const isUp   = fold > 0.5;
              const isDown = fold < -0.5;
              const barW   = (Math.abs(f.impact) / maxImpact) * 100;
              const posImpact = f.impact > 0;

              return (
                <tr key={f.gene} className="hover:bg-slate-50 transition-colors group relative">
                  {/* Gene */}
                  <td className="px-4 py-3 relative">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-navy-700 text-sm">{f.gene}</span>
                      <button
                        className="opacity-0 group-hover:opacity-100 w-4 h-4 rounded-full bg-blue-50 border border-blue-200 text-blue-500 text-[9px] flex items-center justify-center transition-opacity"
                        onMouseEnter={() => setTooltip(f.gene)}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        i
                      </button>
                    </div>
                    {tooltip === f.gene && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-60 bg-navy-700 text-white text-xs px-3.5 py-3 rounded-lg shadow-2xl leading-relaxed">
                        <p className="font-bold mb-1">{f.meta.role}</p>
                        <p className="opacity-80">{f.meta.fn}</p>
                      </div>
                    )}
                  </td>

                  {/* Expression */}
                  <td className="px-4 py-3 font-mono text-slate-700 text-sm tabular-nums">
                    {(f.expression ?? 0).toFixed(2)}
                  </td>

                  {/* Baseline */}
                  <td className="px-4 py-3 font-mono text-slate-400 text-sm tabular-nums">
                    {f.baseline.toFixed(2)}
                  </td>

                  {/* Fold change */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-bold px-2 py-1 rounded-md ${
                      isUp   ? 'bg-red-50 text-red-600'   :
                      isDown ? 'bg-blue-50 text-blue-600' :
                               'bg-slate-100 text-slate-500'
                    }`}>
                      {fold >= 0 ? '+' : ''}{fold.toFixed(2)}
                      {isUp ? ' ↑' : isDown ? ' ↓' : ''}
                    </span>
                  </td>

                  {/* Biological Role */}
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-700">{f.meta.role}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{f.meta.fn}</p>
                  </td>

                  {/* Impact bar */}
                  <td className="px-4 py-3 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barW}%`,
                            background: posImpact ? '#dc2626' : '#1d4ed8',
                          }}
                        />
                      </div>
                      <span className={`text-xs font-mono tabular-nums w-14 text-right font-bold ${
                        posImpact ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {f.impact >= 0 ? '+' : ''}{f.impact.toFixed(3)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-red-500 inline-block" />
          Overexpressed (risk-increasing)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-blue-600 inline-block" />
          Underexpressed (protective)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-slate-300 inline-block" />
          Near baseline
        </span>
        <span className="ml-auto opacity-60 hidden sm:block">
          Baseline: Healthy cohort median log₂ expression
        </span>
      </div>
    </div>
  );
}
