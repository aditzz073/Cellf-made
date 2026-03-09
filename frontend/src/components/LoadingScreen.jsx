import React, { useState, useEffect, useRef } from 'react';

const MESSAGES = [
  'Parsing gene expression profile…',
  'Normalizing transcriptomic values…',
  'Evaluating immune response signatures…',
  'Running AI risk model inference…',
  'Computing per-gene feature importances…',
  'Generating risk classification…',
  'Preparing analysis results…',
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length);
    }, 900);
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
      padding: '2rem',
      gap: '2rem',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>🧬</div>
        <div style={{ color: 'var(--color-navy)', fontWeight: 700, fontSize: '1.1rem' }}>
          SepsisAI
        </div>
      </div>

      {/* Spinner */}
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-navy)',
          animation: 'spin 0.9s linear infinite',
        }} />
        {/* Inner ring */}
        <div style={{
          position: 'absolute',
          inset: 12,
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          animation: 'spin 0.6s linear infinite reverse',
        }} />
      </div>

      {/* Status text */}
      <div style={{ textAlign: 'center', maxWidth: 340 }}>
        <p style={{
          fontSize: '1rem',
          fontWeight: 500,
          color: 'var(--color-navy)',
          marginBottom: '0.35rem',
          transition: 'opacity 0.3s ease',
        }}>
          Analyzing…
        </p>
        <p
          key={msgIndex}
          style={{
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            animation: 'fadeIn 0.35s ease',
          }}
        >
          {MESSAGES[msgIndex]}
        </p>
      </div>

      {/* Dot progress */}
      <div style={{ display: 'flex', gap: '0.4rem' }}>
        {MESSAGES.map((_, i) => (
          <div key={i} style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i === msgIndex ? 'var(--color-navy)' : 'var(--color-border-d)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', textAlign: 'center' }}>
        This may take a few seconds
      </p>
    </div>
  );
}
