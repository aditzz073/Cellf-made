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
  const allDone = activeStep >= STEPS.length;

  useEffect(() => {
    if (allDone) return;
    const id = setInterval(() => setActiveStep(s => s + 1), 750);
    return () => clearInterval(id);
  }, [allDone]);

  const progress = allDone ? 95 : Math.round((activeStep / STEPS.length) * 100);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 font-sans" style={{ background: '#F8FAFC' }}>
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo block */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-md mb-4"
            style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(15,23,42,0.08), 0 4px 16px rgba(15,23,42,0.08)' }}>
            <img src="/dna.png" alt="SepsisAI" className="w-10 h-10 object-contain" />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#0F172A' }}>Transcriptomic Analysis</h2>
          <p style={{ fontSize: '0.9375rem', color: '#475569' }}>Running AI-powered sepsis risk prediction pipeline…</p>
        </div>

        {/* Progress bar */}
        <div className="mb-7 rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }}>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Processing</span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1F3A5F' }}>{progress}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(to right, #3A7CA5, #1F3A5F)' }}
            />
          </div>
        </div>

        {/* Step list */}
        <div className="space-y-2.5">
          {STEPS.map((step, idx) => {
            const done    = idx < activeStep;
            const active  = idx === activeStep;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300"
                style={{
                  background:   done ? '#F0FDF4' : active ? '#EEF3F9' : '#FFFFFF',
                  borderColor:  done ? '#BBF7D0' : active ? '#B8D0E7' : '#E5E7EB',
                  opacity:      !done && !active ? 0.45 : 1,
                  boxShadow:    active ? '0 2px 8px rgba(31,58,95,0.08)' : 'none',
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: done ? '#16A34A' : active ? '#1F3A5F' : '#E5E7EB' }}>
                  {done ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : active ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#94A3B8' }} />
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate"
                    style={{ color: done ? '#15803D' : active ? '#1F3A5F' : '#94A3B8' }}>
                    {step.label}
                  </p>
                  {(done || active) && (
                    <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{step.detail}</p>
                  )}
                </div>

                {done && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#16A34A', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Awaiting server */}
        {allDone && (
          <div className="mt-2 flex items-center justify-center gap-3 rounded-xl px-4 py-3.5 animate-fade-in"
            style={{ background: '#FFFFFF', border: '1px solid #B8D0E7', boxShadow: '0 2px 8px rgba(31,58,95,0.08)' }}>
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
              style={{ borderColor: '#3A7CA5', borderTopColor: 'transparent' }} />
            <p className="text-sm font-medium" style={{ color: '#1F3A5F' }}>Awaiting server response…</p>
          </div>
        )}

        <p className="text-center mt-6" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
          Powered by SepsisAI · Research-grade sepsis risk prediction
        </p>
      </div>
    </div>
  );
}
