import React, { useState, useEffect } from 'react';

/**
 * ValidationStatus - animated step-by-step validation display.
 *
 * Props:
 *   steps      - array of { label: string, detail: string, status: 'pending'|'ok'|'error' }
 *   onComplete - callback(allPassed: boolean) called after all steps animate through
 */
export default function ValidationStatus({ steps = [], onComplete }) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= steps.length) return;
    const t = setTimeout(() => setRevealed(r => r + 1), 480);
    return () => clearTimeout(t);
  }, [revealed, steps.length]);

  useEffect(() => {
    if (revealed === steps.length && steps.length > 0) {
      const allPassed = steps.every(s => s.status !== 'error');
      const t = setTimeout(() => onComplete?.(allPassed), 400);
      return () => clearTimeout(t);
    }
  }, [revealed, steps, onComplete]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem',
    }}>
      <div className="card fade-in-scale" style={{
        width: '100%',
        maxWidth: 480,
        padding: '2.5rem',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-accent-lt)',
              border: '1px solid #bfdbfe',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
            }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="6" />
                <path d="m20 20-4.2-4.2" strokeLinecap="round" />
              </svg>
            </span>
          </div>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--color-navy)', marginBottom: '0.35rem' }}>
            Validating Input Data
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Checking gene panel compatibility and expression ranges
          </p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {steps.map((step, i) => {
            const isVisible = i < revealed;
            const isPending = i >= revealed;
            const isError = step.status === 'error';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.8rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid',
                  borderColor: isPending
                    ? 'var(--color-border)'
                    : isError
                      ? 'var(--color-risk-high-bd)'
                      : 'var(--color-risk-low-bd)',
                  background: isPending
                    ? 'var(--color-surface-2)'
                    : isError
                      ? 'var(--color-risk-high-bg)'
                      : 'var(--color-risk-low-bg)',
                  opacity: isPending ? 0.45 : 1,
                  animation: isVisible ? 'fadeIn 0.3s ease both' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '0.85rem',
                  background: isPending
                    ? 'var(--color-border)'
                    : isError
                      ? 'var(--color-risk-high)'
                      : 'var(--color-risk-low)',
                  color: isPending ? 'var(--color-text-dim)' : '#fff',
                  fontWeight: 700,
                }}>
                  {isPending ? i + 1 : isError ? <ErrorIcon /> : <CheckIcon />}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isPending
                      ? 'var(--color-text-dim)'
                      : isError
                        ? 'var(--color-risk-high)'
                        : 'var(--color-risk-low)',
                    marginBottom: '0.15rem',
                  }}>
                    {step.label}
                  </div>
                  {isVisible && step.detail && (
                    <div style={{
                      fontSize: '0.78rem',
                      color: isError ? 'var(--color-risk-high)' : 'var(--color-text-muted)',
                      animation: 'fadeIn 0.25s ease',
                    }}>
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* In-progress indicator */}
        {revealed < steps.length && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            marginTop: '1.5rem',
          }}>
            <div className="spinner spinner-accent" style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Running checks…
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
