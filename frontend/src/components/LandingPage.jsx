import React from 'react';

const WORKFLOW_STEPS = [
  {
    icon: '🧬',
    title: 'Provide Gene Data',
    desc: 'Upload a CSV, enter values manually, or paste raw data for 10 key genes.',
  },
  {
    icon: '⚙️',
    title: 'AI Model Analysis',
    desc: 'Transcriptomic profiles are evaluated by biology-informed ML models.',
  },
  {
    icon: '📊',
    title: 'Risk Prediction',
    desc: 'Receive a quantitative sepsis risk score with per-gene explainability.',
  },
  {
    icon: '📄',
    title: 'Clinical Report',
    desc: 'Download a structured PDF report suitable for research documentation.',
  },
];

const FEATURES = [
  { label: 'Gene Panel', value: '10-gene transcriptomic signature' },
  { label: 'Risk Classes', value: 'High · Moderate · Low' },
  { label: 'Explainability', value: 'Per-gene feature importance' },
  { label: 'Output', value: 'Interactive heatmap + PDF report' },
];

export default function LandingPage({ onStart }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-navy)',
        padding: '0.9rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🧬</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            SepsisAI
          </span>
        </div>
        <span style={{
          background: 'rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.75)',
          fontSize: '0.72rem',
          fontWeight: 600,
          padding: '0.3em 0.75em',
          borderRadius: '999px',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          Research Use Only
        </span>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(160deg, var(--color-navy) 0%, #163060 60%, #1a4080 100%)',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        flex: '0 0 auto',
      }}>
        <div style={{ maxWidth: 660, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(37,99,235,0.35)',
            border: '1px solid rgba(147,197,253,0.35)',
            borderRadius: '999px',
            padding: '0.3em 0.9em',
            fontSize: '0.78rem',
            color: '#93c5fd',
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            marginBottom: '1.5rem',
          }}>
            ◉ Clinical Decision Support Tool
          </div>

          <h1 style={{
            color: '#fff',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '1.1rem',
          }}>
            AI-Based Sepsis Risk Prediction<br />
            <span style={{ color: '#93c5fd' }}>from Gene Expression Data</span>
          </h1>

          <p style={{
            color: 'rgba(219,234,254,0.85)',
            fontSize: '1.05rem',
            lineHeight: 1.7,
            marginBottom: '2.25rem',
            maxWidth: 520,
            margin: '0 auto 2.25rem',
          }}>
            Submit patient transcriptomic profiles to receive quantitative sepsis risk scores
            powered by ML models trained on immune-response gene signatures.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-accent btn-lg"
              onClick={onStart}
              style={{ minWidth: 200 }}
            >
              Start Analysis →
            </button>
            <a
              href="#how-it-works"
              className="btn btn-secondary btn-lg"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                minWidth: 160,
              }}
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ── Workflow diagram ─────────────────────────────────── */}
      <section id="how-it-works" style={{
        background: 'var(--color-surface-2)',
        padding: '3.5rem 1.5rem',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h4 style={{ textAlign: 'center', marginBottom: '2.5rem' }}>How It Works</h4>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0',
            alignItems: 'center',
          }}>
            {WORKFLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.title}>
                <div style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem 1.25rem',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.6rem' }}>{step.icon}</div>
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--color-accent-lt)',
                    color: 'var(--color-accent)',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.15em 0.6em',
                    marginBottom: '0.5rem',
                    letterSpacing: '0.03em',
                  }}>
                    Step {i + 1}
                  </div>
                  <h3 style={{ fontSize: '0.95rem', marginBottom: '0.4rem', color: 'var(--color-navy)' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.55, color: 'var(--color-text-muted)' }}>
                    {step.desc}
                  </p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div style={{
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    color: 'var(--color-accent)',
                    padding: '0 0.25rem',
                  }}>
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature highlights ───────────────────────────────── */}
      <section style={{
        background: 'var(--color-surface)',
        padding: '3rem 1.5rem',
        borderTop: '1px solid var(--color-border)',
      }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <h4 style={{ textAlign: 'center', marginBottom: '1.75rem' }}>Platform Capabilities</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1rem',
          }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.1rem 1.25rem',
                borderLeft: '3px solid var(--color-accent)',
              }}>
                <div style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-text-muted)',
                  marginBottom: '0.3rem',
                }}>
                  {f.label}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-navy)' }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA footer ──────────────────────────────────────── */}
      <section style={{
        background: 'var(--color-navy)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        marginTop: 'auto',
      }}>
        <p style={{ color: 'rgba(219,234,254,0.7)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Ready to analyze a patient's transcriptomic profile?
        </p>
        <button className="btn btn-accent btn-lg" onClick={onStart}>
          Begin Sepsis Risk Analysis →
        </button>
        <p style={{ color: 'rgba(219,234,254,0.45)', fontSize: '0.72rem', marginTop: '1.2rem' }}>
          For research and educational purposes only. Not validated for clinical diagnosis.
        </p>
      </section>
    </div>
  );
}
