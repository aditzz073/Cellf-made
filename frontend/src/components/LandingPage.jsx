/**
 * components/LandingPage.jsx
 * Biotech SaaS landing page - full 7-section redesign.
 * Props remain identical: { onStart, onLogin, onSignup, onProfile }
 */
import React, { useEffect, useRef } from 'react';
import Navbar from './Navbar.jsx';

/* ── Data ───────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>
    ),
    title: 'Gene Expression Analysis',
    desc: 'Process wide-format GEO genomic datasets with 24,000+ V-feature probe columns directly from CSV uploads.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14"/>
        <path d="M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/>
      </svg>
    ),
    title: 'ML Inference Engine',
    desc: 'Biology-informed Random Forest model trained on GEO sepsis datasets, with StandardScaler preprocessing for clinical-grade input normalization.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Explainable AI Output',
    desc: 'Ranked feature impact scores alongside risk stratification (High · Moderate · Low) with downloadable clinical PDF reports.',
  },
];

const CAPABILITIES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M8 4c2 2 2 4 0 6s-2 4 0 6 2 4 0 6" />
        <path d="M16 4c-2 2-2 4 0 6s2 4 0 6-2 4 0 6" />
        <path d="M7 7h10" />
        <path d="M7 17h10" />
      </svg>
    ),
    label: 'Feature Space',
    title: '24,840 Gene Features',
    desc: 'Processes full GEO-format expression matrices including all V-column probe identifiers without pre-filtering.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M13 2 4 14h7l-1 8 10-13h-7z" />
      </svg>
    ),
    label: 'Inference',
    title: 'Real-Time Prediction',
    desc: 'Sub-second risk inference using a serialized sklearn pipeline - no batch queuing or preprocessing delay.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 18h12" />
        <path d="M8 18a4 4 0 0 0 8 0" />
        <path d="M10 4h4" />
        <path d="M12 4v6" />
        <circle cx="12" cy="13" r="2.5" />
      </svg>
    ),
    label: 'Explainability',
    title: 'Ranked Feature Impacts',
    desc: 'Per-sample SHAP-style feature rankings expose which gene markers drove the model\'s risk decision.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
        <path d="M14 2v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </svg>
    ),
    label: 'Reporting',
    title: 'Structured PDF Reports',
    desc: 'Auto-generated clinical documentation with risk score, feature table, and patient identifier for archival.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Upload Gene Data', desc: 'Submit a single-sample GEO wide-format CSV or paste feature values manually.' },
  { step: '02', title: 'AI Inference', desc: 'The biology-informed ML model evaluates immune response patterns across gene features.' },
  { step: '03', title: 'Risk Stratification', desc: 'Receive sepsis probability with probability score and ranked feature importance.' },
  { step: '04', title: 'Clinical Report', desc: 'Download a structured PDF for research documentation and clinical reference.' },
];

const USE_CASES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 20V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13" />
        <path d="M9 20v-5h6v5" />
        <path d="M12 8v4" />
        <path d="M10 10h4" />
      </svg>
    ),
    title: 'Hospitals & ICUs',
    desc: 'Early sepsis risk flagging for critically ill patients based on admission-time gene profiling.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M6 18h12" />
        <path d="M8 18a4 4 0 0 0 8 0" />
        <path d="M10 4h4" />
        <path d="M12 4v6" />
        <circle cx="12" cy="13" r="2.5" />
      </svg>
    ),
    title: 'Research Laboratories',
    desc: 'Batch analysis of GEO cohort datasets for transcriptomic sepsis biomarker discovery.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M10 2h4" />
        <path d="M11 2v6l-5.5 9.5A2 2 0 0 0 7.2 21h9.6a2 2 0 0 0 1.7-3.5L13 8V2" />
        <path d="M8.5 14h7" />
      </svg>
    ),
    title: 'Diagnostics Companies',
    desc: 'Integration-ready ML endpoint for embedding sepsis risk into diagnostic platforms and EHR pipelines.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M8 4c2 2 2 4 0 6s-2 4 0 6 2 4 0 6" />
        <path d="M16 4c-2 2-2 4 0 6s2 4 0 6-2 4 0 6" />
        <path d="M7 7h10" />
        <path d="M7 17h10" />
      </svg>
    ),
    title: 'Biotech Startups',
    desc: 'Rapidly prototype immune-response AI products on publicly available transcriptomic training data.',
  },
];

const TECH_TAGS = [
  'Random Forest · StandardScaler',
  'GEO Wide-Format Input',
  'Ranked Feature Explainability',
  'GEO Sepsis Datasets',
  'PDF Clinical Report',
  'REST API Ready',
];

/* ── Gene Network SVG ──────────────────────────────────────── */
const GENE_NODES = [
  { x: 159, y: 54,  gene: 'IL6',    color: '#DC2626' },
  { x: 232, y: 95,  gene: 'TLR4',   color: '#D97706' },
  { x: 256, y: 177, gene: 'TNF',    color: '#DC2626' },
  { x: 214, y: 255, gene: 'CXCL8',  color: '#EA580C' },
  { x: 122, y: 270, gene: 'MMP8',   color: '#7C3AED' },
  { x: 60,  y: 214, gene: 'HLA-DRA',color: '#1D4ED8' },
  { x: 50,  y: 128, gene: 'STAT3',  color: '#0891B2' },
  { x: 104, y: 60,  gene: 'CD14',   color: '#059669' },
  { x: 228, y: 44,  gene: 'LBP',    color: '#D97706' },
  { x: 268, y: 136, gene: 'PCSK9',  color: '#7C3AED' },
];

function GeneNetworkSVG() {
  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* subtle dot-grid background */}
      <div
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <svg viewBox="0 0 320 320" className="w-full h-full relative z-10">
        {/* Outer rings */}
        <circle cx={160} cy={160} r={125} fill="none" stroke="#E5E7EB" strokeWidth={1} />
        <circle cx={160} cy={160} r={95}  fill="none" stroke="#EEF3F9" strokeWidth={1} strokeDasharray="4 4" />
        <circle cx={160} cy={160} r={65}  fill="none" stroke="#DBEAFE" strokeWidth={1} />

        {/* Spokes */}
        {GENE_NODES.map((n) => (
          <line key={`s-${n.gene}`} x1={160} y1={160} x2={n.x} y2={n.y}
            stroke="#CBD5E1" strokeWidth={1.5} strokeDasharray="3 3" />
        ))}

        {/* Center node */}
        <circle cx={160} cy={160} r={36} fill="#1F3A5F" />
        <circle cx={160} cy={160} r={36} fill="url(#centerGrad)" opacity={0.6} />
        <defs>
          <radialGradient id="centerGrad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#5DA9E9" />
            <stop offset="100%" stopColor="#1F3A5F" />
          </radialGradient>
        </defs>
        <text x={160} y={155} textAnchor="middle" fill="white" fontSize={9} fontFamily="Inter" fontWeight="700" letterSpacing="1">SEPSIS</text>
        <text x={160} y={167} textAnchor="middle" fill="white" fontSize={9} fontFamily="Inter" fontWeight="700" letterSpacing="1">RISK · AI</text>

        {/* Gene nodes */}
        {GENE_NODES.map((n) => (
          <g key={n.gene}>
            <circle cx={n.x} cy={n.y} r={22} fill={n.color} opacity={0.85} />
            <circle cx={n.x} cy={n.y} r={22} fill="white" opacity={0.1} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white"
              fontSize={n.gene.length > 5 ? 7 : 8}
              fontFamily="Inter" fontWeight="700">
              {n.gene}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Section fade-in hook ────────────────────────────────────── */
function useSectionFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('opacity-100', 'translate-y-0'); el.classList.remove('opacity-0', 'translate-y-6'); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Landing page ───────────────────────────────────────────── */
export default function LandingPage({ onStart, onLogin, onSignup, onProfile }) {
  const featRef  = useSectionFadeIn();
  const capRef   = useSectionFadeIn();
  const flowRef  = useSectionFadeIn();
  const caseRef  = useSectionFadeIn();

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8FAFC' }}>

      {/* ── Navbar ── */}
      <Navbar onLogin={onLogin} onSignup={onSignup} onProfile={onProfile}
        onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

      {/* ════════════════════════════════════════
          1. HERO SECTION
         ════════════════════════════════════════ */}
      <section id="home" className="bg-white border-b border-gray-200">
        <div className="max-w-content mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">

          {/* Left - headline + CTAs */}
          <div className="lg:col-span-3">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase mb-7"
              style={{ background: '#EEF3F9', borderColor: '#B8D0E7', color: '#3A7CA5' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#5DA9E9' }} />
              Gene Expression · ML Inference · Sepsis Risk
            </div>

            <h1 className="font-extrabold leading-tight mb-6"
              style={{ fontSize: 'clamp(36px, 5vw, 52px)', color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              AI-Powered Sepsis<br />
              <span style={{ color: '#1F3A5F' }}>Transcriptomic</span>{' '}
              <span style={{ color: '#3A7CA5' }}>Risk Analyzer</span>
            </h1>

            <p className="mb-8 leading-relaxed" style={{ fontSize: '1.0625rem', color: '#475569', maxWidth: 520 }}>
              Upload patient gene expression data to predict sepsis risk using machine learning
              trained on transcriptomic datasets - research-grade genomic AI for clinical decision support.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 mb-9">
              {[
                { val: '24,840', label: 'Gene Features' },
                { val: '3-Class', label: 'Risk Stratification' },
                { val: 'PDF',     label: 'Clinical Reports' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div className="font-bold" style={{ fontSize: '1.25rem', color: '#1F3A5F' }}>{val}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <button onClick={onStart} className="btn btn-primary btn-lg inline-flex items-center gap-2">
                Begin Analysis
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a href="#features"
                onClick={e => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="btn btn-secondary btn-lg">
                How it works
              </a>
            </div>
          </div>

          {/* Right - gene network */}
          <div className="lg:col-span-2 hidden lg:flex items-center justify-center">
            <div className="rounded-2xl p-6" style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}>
              <GeneNetworkSVG />
              <p className="text-center mt-3" style={{ fontSize: '0.75rem', color: '#94A3B8', letterSpacing: '0.08em' }}>
                IMMUNE RESPONSE GENE NETWORK
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════
          2. TECH STRIP
         ════════════════════════════════════════ */}
      <div style={{ background: '#1F3A5F', borderBottom: '1px solid #162A46' }}>
        <div className="max-w-content mx-auto px-6 py-3.5 flex flex-wrap justify-center gap-x-8 gap-y-2">
          {TECH_TAGS.map((tag) => (
            <span key={tag} className="flex items-center gap-2" style={{ color: '#93C5FD', fontSize: '0.8125rem', fontWeight: 500 }}>
              <span className="w-1 h-1 rounded-full" style={{ background: '#5DA9E9' }} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          3. FEATURES SECTION
         ════════════════════════════════════════ */}
      <section id="features" className="section" style={{ background: '#F8FAFC' }}>
        <div className="max-w-content mx-auto px-6">
          <div
            ref={featRef}
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <div className="section-header">
              <span className="section-eyebrow">Platform Capabilities</span>
              <h2 className="section-title">Built for Clinical-Grade Genomics</h2>
              <p className="section-sub">
                Every component of the pipeline is designed for scientific rigour -
                from raw expression input to explainable risk output.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(({ icon, title, desc }) => (
                <div key={title} className="feature-card">
                  <div className="feature-icon">{icon}</div>
                  <div className="feature-title">{title}</div>
                  <p className="feature-desc">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          4. CAPABILITIES GRID
         ════════════════════════════════════════ */}
      <section className="section" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-content mx-auto px-6">
          <div
            ref={capRef}
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <div className="section-header">
              <span className="section-eyebrow">Technical Specifications</span>
              <h2 className="section-title">Deep Platform Capabilities</h2>
              <p className="section-sub">
                Engineered on a production-grade ML stack for genomic analysis at scale.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {CAPABILITIES.map(({ icon, label, title, desc }) => (
                <div key={title}
                  className="rounded-xl p-6 text-center transition-all duration-200 cursor-default"
                  style={{ border: '1px solid #E5E7EB', background: '#F8FAFC' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#5DA9E9'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(93,169,233,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
                  <div
                    className="mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: '#DCE8F3', color: '#3A7CA5' }}
                  >
                    {icon}
                  </div>
                  <span className="block mb-1.5" style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94A3B8' }}>{label}</span>
                  <p className="font-bold mb-2" style={{ fontSize: '0.9375rem', color: '#1F3A5F' }}>{title}</p>
                  <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          5. WORKFLOW SECTION
         ════════════════════════════════════════ */}
      <section id="about" className="section" style={{ background: '#F8FAFC' }}>
        <div className="max-w-content mx-auto px-6">
          <div
            ref={flowRef}
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <div className="section-header">
              <span className="section-eyebrow">Analysis Pipeline</span>
              <h2 className="section-title">From Gene Data to Risk Report</h2>
              <p className="section-sub">
                A four-stage automated transcriptomic pipeline, from raw expression input to actionable clinical output.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* connector line desktop */}
              <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
                style={{ background: 'linear-gradient(to right, #E5E7EB, #5DA9E9, #E5E7EB)', zIndex: 0 }} />

              {WORKFLOW.map(({ step, title, desc }) => (
                <div key={step} className="relative z-10 flex flex-col items-center text-center group">
                  <div
                    className="w-24 h-24 rounded-full flex flex-col items-center justify-center mb-5 transition-all duration-200 group-hover:scale-105"
                    style={{ background: '#FFFFFF', border: '2px solid #E5E7EB', boxShadow: '0 2px 12px rgba(15,23,42,0.08)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3A7CA5'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(93,169,233,0.2)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,0.08)'; }}>
                    <span className="font-bold mb-0.5" style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#94A3B8' }}>STEP</span>
                    <span className="font-extrabold" style={{ fontSize: '1.5rem', color: '#1F3A5F', lineHeight: 1 }}>{step}</span>
                  </div>
                  <h3 className="mb-2" style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A' }}>{title}</h3>
                  <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          6. USE CASES
         ════════════════════════════════════════ */}
      <section className="section" style={{ background: '#FFFFFF', borderTop: '1px solid #E5E7EB' }}>
        <div className="max-w-content mx-auto px-6">
          <div
            ref={caseRef}
            className="opacity-0 translate-y-6 transition-all duration-700"
          >
            <div className="section-header">
              <span className="section-eyebrow">Use Cases</span>
              <h2 className="section-title">Who Uses SepsisAI</h2>
              <p className="section-sub">
                Purpose-built for research and clinical environments where accuracy, interpretability, and speed matter.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {USE_CASES.map(({ icon, title, desc }) => (
                <div key={title}
                  className="rounded-xl p-6 transition-all duration-200"
                  style={{ border: '1px solid #E5E7EB', background: '#F8FAFC' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F3A5F'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(31,58,95,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div
                    className="mb-4 h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ background: '#DCE8F3', color: '#3A7CA5' }}
                  >
                    {icon}
                  </div>
                  <h3 className="mb-2" style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{title}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          7. CTA SECTION
         ════════════════════════════════════════ */}
      <section id="contact" style={{ background: '#1F3A5F' }}>
        <div className="max-w-content mx-auto px-6 py-20 lg:py-24 text-center">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(93,169,233,0.15)', color: '#5DA9E9', border: '1px solid rgba(93,169,233,0.3)' }}>
            Get Started Today
          </span>
          <h2 className="font-extrabold mb-4"
            style={{ fontSize: 'clamp(28px, 4vw, 40px)', color: '#FFFFFF', letterSpacing: '-0.015em' }}>
            Ready to Analyze Gene Expression?
          </h2>
          <p className="mb-10 mx-auto leading-relaxed"
            style={{ color: '#93C5FD', fontSize: '1.0625rem', maxWidth: 520 }}>
            Upload or paste GEO-format expression data to generate a comprehensive sepsis
            risk prediction with explainable AI - in seconds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={onStart}
              className="inline-flex items-center gap-2 font-bold rounded-xl transition-all duration-200"
              style={{ background: '#FFFFFF', color: '#1F3A5F', padding: '0.875rem 2rem', fontSize: '1rem',
                       boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F0F9FF'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.transform = 'none'; }}>
              Start Analysis
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <a href="#features"
              onClick={e => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 font-semibold rounded-xl transition-all duration-200"
              style={{ color: '#93C5FD', border: '1px solid rgba(147,197,253,0.4)', padding: '0.875rem 1.75rem', fontSize: '1rem' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(147,197,253,0.8)'; e.currentTarget.style.background = 'rgba(93,169,233,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(147,197,253,0.4)'; e.currentTarget.style.background = 'transparent'; }}>
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          8. FOOTER
         ════════════════════════════════════════ */}
      <footer style={{ background: '#0D1B2D', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-content mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/dna.png" alt="SepsisAI" className="w-7 h-7 object-contain" />
                <span className="font-bold text-white text-lg">SepsisAI</span>
                <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: 'rgba(93,169,233,0.15)', color: '#5DA9E9' }}>
                  Research Preview
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.7 }}>
                AI-powered sepsis risk analysis from transcriptomic gene expression data.
              </p>
            </div>

            {/* Nav links */}
            <div>
              <h4 className="mb-4" style={{ color: '#94A3B8', fontSize: '0.7rem', letterSpacing: '0.12em' }}>Navigation</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Home',     href: '#home' },
                  { label: 'Features', href: '#features' },
                  { label: 'About',    href: '#about' },
                  { label: 'Contact',  href: '#contact' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href}
                      onClick={e => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); }}
                      style={{ color: '#64748B', fontSize: '0.875rem', transition: 'color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#93C5FD'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; }}>
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal / info */}
            <div>
              <h4 className="mb-4" style={{ color: '#94A3B8', fontSize: '0.7rem', letterSpacing: '0.12em' }}>Legal</h4>
              <p style={{ fontSize: '0.8125rem', color: '#475569', lineHeight: 1.7 }}>
                For research use only.<br />
                Not validated for clinical diagnosis or treatment decisions.<br />
                Outputs are generated from a trained Random Forest pipeline.
              </p>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '0.8125rem', color: '#334155' }}>
              © {new Date().getFullYear()} SepsisAI - Research Preview
            </p>
            <div className="flex items-center gap-4">
              {['Random Forest', 'GEO Datasets', 'PDF Reports'].map((tag) => (
                <span key={tag} style={{ fontSize: '0.75rem', color: '#334155', padding: '2px 8px',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
