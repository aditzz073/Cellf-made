import React, { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Parsing gene expression profile',         detail: 'Reading transcriptomic input data' },
  { label: 'Normalizing expression values',            detail: 'Applying log₂ standardization' },
  { label: 'Evaluating immune response signatures',    detail: 'Cross-referencing sepsis gene panels' },
  { label: 'Running AI model inference',               detail: 'Computing risk probability score' },
  { label: 'Computing feature importances',            detail: 'SHAP-inspired per-gene impact analysis' },
  { label: 'Generating risk classification',           detail: 'High / Moderate / Low stratification' },
  { label: 'Preparing analysis results',               detail: 'Finalizing report output' },
];

export default function LoadingScreen() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => Math.min(s + 1, STEPS.length)), 750);
    return () => clearInterval(id);
  }, []);

  const progress = Math.round((activeStep / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl border border-slate-200 shadow-md mb-4">
            <span className="text-3xl">🧬</span>
          </div>
          <h2 className="text-xl font-bold text-navy-700 mb-1">Transcriptomic Analysis</h2>
          <p className="text-sm text-slate-500">Running AI-powered sepsis risk prediction pipeline…</p>
        </div>

        {/* Progress bar */}
        <div className="mb-7 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processing</span>
            <span className="text-xs font-mono font-bold text-navy-700">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2.5">
          {STEPS.map((step, idx) => {
            const done    = idx < activeStep;
            const active  = idx === activeStep;
            const pending = idx > activeStep;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300 ${
                  done    ? 'bg-green-50 border-green-200' :
                  active  ? 'bg-blue-50 border-blue-300 shadow-sm' :
                            'bg-white border-slate-200 opacity-40'
                }`}
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  done   ? 'bg-green-500' :
                  active ? 'bg-blue-600'  :
                           'bg-slate-200'
                }`}>
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : active ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    done ? 'text-green-700' : active ? 'text-blue-700' : 'text-slate-400'
                  }`}>{step.label}</p>
                  {(done || active) && (
                    <p className="text-xs text-slate-500 mt-0.5">{step.detail}</p>
                  )}
                </div>

                {/* Done tick label */}
                {done && (
                  <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide flex-shrink-0">
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by SepsisAI · Research-grade sepsis risk prediction
        </p>
      </div>
    </div>
  );
}
