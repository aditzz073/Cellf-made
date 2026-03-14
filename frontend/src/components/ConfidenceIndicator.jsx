import React, { useState } from 'react';

/**
 * ConfidenceIndicator - SVG arc gauge for model confidence.
 *
 * Props:
 *   confidence  - 0–1 float
 *   modelType   - string (optional)
 */
export default function ConfidenceIndicator({ confidence, modelType }) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  if (confidence == null) return null;

  const pct = Math.round(confidence * 100);
  const r = 44;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;
  const filled = (pct / 100) * circumference;

  const confColor =
    pct >= 80 ? '#16a34a' :
    pct >= 60 ? '#d97706' :
                '#dc2626';

  const confLabel =
    pct >= 80 ? 'High confidence' :
    pct >= 60 ? 'Moderate confidence' :
                'Low confidence';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600">
          Model Confidence
        </p>
        <div className="relative">
          <button
            className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 text-xs flex items-center justify-center transition-colors"
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
          >
            ?
          </button>
          {tooltipVisible && (
            <div className="absolute right-0 top-7 w-64 z-20 bg-navy-700 text-white text-xs px-3.5 py-3 rounded-lg shadow-2xl leading-relaxed">
              Confidence represents prediction certainty relative to training dataset patterns.
              Higher values indicate the input profile closely matches known risk signatures.
              <div className="absolute -top-1.5 right-2 w-3 h-3 bg-navy-700 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {/* Content row */}
      <div className="flex items-center gap-5">
        {/* SVG arc gauge */}
        <div className="flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            {/* Track */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#e2e8f0" strokeWidth={9}
            />
            {/* Fill arc */}
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={confColor}
              strokeWidth={9}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
            />
            {/* Center text */}
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize={22} fontWeight="800"
              fill={confColor} fontFamily="Inter, sans-serif">
              {pct}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={12} fill="#94a3b8"
              fontFamily="Inter, sans-serif">
              %
            </text>
          </svg>
        </div>

        {/* Labels */}
        <div className="space-y-3">
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Certainty</p>
            <p className="text-sm font-bold" style={{ color: confColor }}>{confLabel}</p>
          </div>
          {modelType && (
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Model</p>
              <p className="text-xs font-mono font-semibold text-navy-700 leading-snug">{modelType}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">Threshold</p>
            <p className="text-xs text-slate-600">≥80% high · ≥60% moderate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
