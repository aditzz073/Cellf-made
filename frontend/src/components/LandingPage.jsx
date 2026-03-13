import React from 'react';
import Navbar from './Navbar.jsx';

const FEATURE_PREVIEW = ['V1', 'V2', 'V3', 'V10', 'V100', 'V1000', 'V5000', 'V10000', 'V20000', 'V24840'];

const WORKFLOW = [
  {
    step: '01',
    title: 'Input Gene Data',
    desc: 'Upload or paste a one-sample GEO wide-format CSV with V-feature columns.',
  },
  {
    step: '02',
    title: 'AI Model Inference',
    desc: 'Biology-informed ML model evaluates immune response signature patterns across gene features.',
  },
  {
    step: '03',
    title: 'Risk Stratification',
    desc: 'Receive sepsis probability with ranked feature impacts for interpretation.',
  },
  {
    step: '04',
    title: 'Clinical Report',
    desc: 'Download a structured PDF report for research documentation and clinical reference.',
  },
];

const SPECS = [
  { icon: '🧬', label: 'Feature Space',       value: 'GEO V-columns (wide input)' },
  { icon: '📊', label: 'Risk Classes',         value: 'High · Moderate · Low' },
  { icon: '🔬', label: 'Explainability',       value: 'Ranked feature impacts' },
  { icon: '📄', label: 'Report Output',        value: 'Interactive + PDF report' },
];

// Deterministic gene positions (no random — stable SVG)
const GENE_NODES = [
  { x: 159, y: 54,  gene: 'IL6',     color: '#dc2626' },
  { x: 232, y: 95,  gene: 'TLR4',    color: '#d97706' },
  { x: 256, y: 177, gene: 'TNF',     color: '#dc2626' },
  { x: 214, y: 255, gene: 'CXCL8',   color: '#f97316' },
  { x: 122, y: 270, gene: 'MMP8',    color: '#7c3aed' },
  { x:  60, y: 214, gene: 'HLA-DRA', color: '#1d4ed8' },
  { x:  50, y: 128, gene: 'STAT3',   color: '#0891b2' },
  { x: 104, y:  60, gene: 'CD14',    color: '#059669' },
  { x: 228, y:  44, gene: 'LBP',     color: '#d97706' },
  { x: 268, y: 136, gene: 'PCSK9',   color: '#7c3aed' },
];

function GeneNetworkSVG() {
  return (
    <div className="relative w-72 h-72 mx-auto">
      <svg viewBox="0 0 320 320" className="w-full h-full">
        {/* ring pulse */}
        <circle cx={160} cy={160} r={70} fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" />
        <circle cx={160} cy={160} r={100} fill="none" stroke="#f1f5f9" strokeWidth={1} />

        {/* spokes */}
        {GENE_NODES.map((n) => (
          <line key={`s-${n.gene}`} x1={160} y1={160} x2={n.x} y2={n.y}
            stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="3 3" />
        ))}

        {/* center */}
        <circle cx={160} cy={160} r={34} fill="#1e3a5f" />
        <text x={160} y={156} textAnchor="middle" fill="white" fontSize={9} fontFamily="Inter" fontWeight="600">SEPSIS</text>
        <text x={160} y={169} textAnchor="middle" fill="white" fontSize={9} fontFamily="Inter" fontWeight="600">RISK AI</text>

        {/* gene nodes */}
        {GENE_NODES.map((n) => (
          <g key={n.gene}>
            <circle cx={n.x} cy={n.y} r={22} fill={n.color} opacity={0.88} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill="white"
              fontSize={n.gene.length > 5 ? 7 : 8}
              fontFamily="JetBrains Mono, monospace" fontWeight="600">
              {n.gene}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function LandingPage({ onStart, onLogin, onSignup, onProfile }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Navigation ── */}
      <Navbar
        onLogin={onLogin}
        onSignup={onSignup}
        onProfile={onProfile}
        onGoHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />

      {/* ── Hero ── */}
      <section id="home" className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-5 gap-12 items-center">

          {/* Left text */}
          <div className="lg:col-span-3">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-blue-700 text-xs font-semibold tracking-widest uppercase">
                Gene Expression · ML Inference · Sepsis Risk
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-navy-700 leading-tight mb-5">
              AI-Based Sepsis<br />
              <span className="bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
                Transcriptomic
              </span>{' '}
              Risk Analyzer
            </h1>

            <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-xl">
              Upload patient gene expression data to predict sepsis risk using machine learning models
              trained on transcriptomic datasets. Research-grade genomic analysis for clinical decision support.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2 bg-navy-700 hover:bg-navy-800 text-white font-semibold px-7 py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl text-base"
              >
                Begin Analysis
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a
                href="#features"
                onClick={e => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 text-navy-700 border border-slate-300 hover:border-navy-700 hover:bg-navy-50 font-medium px-6 py-3.5 rounded-lg transition-all text-base"
              >
                How it works
              </a>
            </div>
          </div>

          {/* Right: gene network SVG */}
          <div className="lg:col-span-2 hidden lg:block">
            <GeneNetworkSVG />
          </div>
        </div>
      </section>

      {/* ── Platform specs strip ── */}
      <section className="bg-navy-700 py-4 border-b border-navy-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-x-10 gap-y-2">
          {[
            'Random Forest + StandardScaler',
            'GEO Wide-Format Input',
            'Ranked Feature Explainability',
            'GEO Sepsis Dataset',
            'PDF Clinical Report',
          ].map((item) => (
            <span key={item} className="text-blue-200 text-xs font-medium flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Clinical Workflow ── */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">
              Analysis Pipeline
            </p>
            <h2 className="text-2xl font-bold text-navy-700">From Gene Data to Risk Report</h2>
            <p className="text-slate-500 text-sm mt-2 max-w-xl mx-auto">
              Four-stage automated transcriptomic analysis pipeline for sepsis risk prediction.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* connecting line */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-slate-200 z-0" />

            {WORKFLOW.map(({ step, title, desc }, idx) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-20 h-20 rounded-full bg-white border-2 border-slate-200 shadow-sm flex flex-col items-center justify-center mb-4 group-hover:border-blue-400 group-hover:shadow-md transition-all">
                  <span className="text-[10px] font-bold text-blue-600 tracking-widest">{step}</span>
                </div>
                <h3 className="text-sm font-bold text-navy-700 mb-2">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature specs grid ── */}
      <section className="py-14 bg-white border-t border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase">Platform Capabilities</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {SPECS.map(({ icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-default"
              >
                <span className="text-3xl mb-3">{icon}</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
                <p className="text-sm font-semibold text-navy-700">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Space Preview ── */}
      <section id="about" className="py-14 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
            GEO Feature Space (Preview)
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center mb-6">
            {FEATURE_PREVIEW.map((feature) => (
              <span
                key={feature}
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-navy-700 shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all cursor-default"
              >
                {feature}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            The deployed model consumes a wide GEO-style feature matrix and applies scaler plus Random Forest inference.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="contact" className="py-16 bg-navy-700">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Analyze?</h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Upload or paste GEO-format expression data to generate a comprehensive
            sepsis risk prediction with explainable AI.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-navy-700 font-bold px-8 py-3.5 rounded-lg transition-all shadow-lg hover:shadow-xl text-base"
          >
            Start Analysis
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/dna.png" alt="SepsisAI" className="w-6 h-6 object-contain" />
            <span className="font-bold text-white">SepsisAI</span>
            <span className="text-blue-300 text-xs ml-1">Research Preview</span>
          </div>
          <p className="text-blue-300 text-xs text-center leading-relaxed max-w-md">
            For research use only. Not validated for clinical diagnosis or treatment decisions.
            Outputs are generated from the trained Random Forest + StandardScaler pipeline.
          </p>
        </div>
      </footer>
    </div>
  );
}
