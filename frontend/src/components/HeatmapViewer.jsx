/**
 * components/HeatmapViewer.jsx
 * Interactive Plotly.js gene-expression heatmap (patient vs healthy baseline).
 * Data comes from the feature_importances array returned by /predict.
 */

import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { REFERENCE_BASELINE } from '../constants.js';

/**
 * HeatmapViewer
 *
 * Props:
 *   featureImportances — array of { gene, impact, expression, baseline }
 */
export default function HeatmapViewer({ featureImportances }) {
  const divRef = useRef(null);

  useEffect(() => {
    if (!divRef.current || !featureImportances?.length) return;

    // Sort genes by absolute impact (highest first) for a meaningful x-axis
    const sorted = [...featureImportances].sort(
      (a, b) => Math.abs(b.impact ?? 0) - Math.abs(a.impact ?? 0)
    );

    const genes      = sorted.map(f => f.gene);
    const patientRow = sorted.map(f => f.expression ?? 0);
    const baseRow    = sorted.map(f => f.baseline ?? REFERENCE_BASELINE[f.gene] ?? 0);

    const trace = {
      type: 'heatmap',
      x: genes,
      y: ['Patient', 'Healthy Baseline'],
      z: [patientRow, baseRow],
      colorscale: [
        [0.0,  '#1e40af'],
        [0.25, '#3b82f6'],
        [0.5,  '#fef9c3'],
        [0.75, '#f97316'],
        [1.0,  '#dc2626'],
      ],
      zmin: 0,
      zmax: 12,
      hovertemplate: '<b>%{x}</b><br>%{y}<br>log₂ expr: <b>%{z:.2f}</b><extra></extra>',
      showscale: true,
      colorbar: {
        title: { text: 'log₂', side: 'right', font: { size: 11 } },
        thickness: 14,
        len: 0.85,
        tickfont: { size: 10 },
      },
    };

    const layout = {
      height: 220,
      margin: { t: 16, r: 80, b: 64, l: 130 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      font: { family: 'Inter, system-ui, sans-serif', size: 12, color: '#334155' },
      xaxis: {
        tickangle: -38,
        tickfont: { size: 11, family: 'JetBrains Mono, monospace', color: '#1e3a5f' },
        gridcolor: '#e2e8f0',
        linecolor: '#e2e8f0',
        title: { text: 'Gene Symbol', font: { size: 11, color: '#64748b' }, standoff: 16 },
      },
      yaxis: {
        tickfont: { size: 11 },
        gridcolor: '#e2e8f0',
        linecolor: '#e2e8f0',
      },
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['sendDataToCloud', 'editInChartStudio', 'lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'SepsisAI_expression_heatmap',
        scale: 2,
      },
    };

    Plotly.newPlot(divRef.current, [trace], layout, config);

    return () => {
      if (divRef.current) Plotly.purge(divRef.current);
    };
  }, [featureImportances]);

  if (!featureImportances?.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center p-12 gap-3">
        <span className="text-3xl opacity-30">▦</span>
        <p className="text-sm text-slate-400">No heatmap data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      <div className="px-5 py-4 border-b border-slate-200 flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-0.5">Expression Heatmap</p>
          <p className="text-xs text-slate-500">Patient vs Healthy Baseline · log₂ expression · sorted by impact</p>
        </div>
      </div>
      <div className="p-2 pt-2">
        <div ref={divRef} style={{ width: '100%' }} />
      </div>
    </div>
  );
}


