/**
 * components/ResultsPanel.jsx
 * Complete results panel:  risk gauge · gene impact chart · heatmap · report.
 */

import React, { useState } from 'react';
import RiskGauge from './RiskGauge.jsx';
import GeneImpactChart from './GeneImpactChart.jsx';
import HeatmapViewer from './HeatmapViewer.jsx';
import { generateReport } from '../api/client.js';

export default function ResultsPanel({ results, isLoading, patientId }) {
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [activeSection, setActiveSection] = useState('all');

  if (isLoading) {
    return (
      <div style={styles.loadingState}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Running prediction pipeline…</p>
        <p style={styles.loadingSubtext}>Analysing gene panel · Computing feature importances · Generating heatmap</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div style={styles.emptyState}>
        <EmptyIcon />
        <h3 style={styles.emptyTitle}>No Results Yet</h3>
        <p style={styles.emptyText}>
          Upload a gene expression CSV or enter values manually, then click
          &ldquo;Run Prediction&rdquo; to see the risk assessment.
        </p>
        <div style={styles.emptyBullets}>
          {['Risk score & classification', 'Gene feature importances', 'Expression heatmap', 'Downloadable PDF report'].map((f) => (
            <div key={f} style={styles.bullet}>
              <span style={styles.bulletDot} />
              {f}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { prediction, feature_importances, heatmap_base64, genes } = results;

  // ── PDF download ──────────────────────────────────────────────────────────
  const handleDownloadReport = async () => {
    setReportError('');
    setReportLoading(true);
    try {
      const blob = await generateReport({
        patient_id: patientId || 'ANONYMOUS',
        genes,
        prediction,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sepsis_report_${(patientId || 'ANONYMOUS').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setReportError('Failed to generate report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const modelBadge = prediction.model_type === 'placeholder'
    ? <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>Placeholder Model</span>
    : <span className="badge badge-low" style={{ fontSize: '0.68rem' }}>Trained Model</span>;

  return (
    <div style={styles.panel} className="fade-in">
      {/* ── Header row ── */}
      <div style={styles.headerRow}>
        <div>
          <div style={styles.panelTitle}>Risk Assessment</div>
          {patientId && <div style={styles.patientId}>Patient: {patientId}</div>}
        </div>
        <div style={styles.headerRight}>
          {modelBadge}
          <button
            type="button"
            className="btn btn-primary"
            style={styles.reportBtn}
            onClick={handleDownloadReport}
            disabled={reportLoading}
          >
            {reportLoading
              ? <><span className="spinner" /> Generating…</>
              : <><DownloadIcon /> Download Report</>}
          </button>
        </div>
      </div>

      {reportError && (
        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
          {reportError}
        </div>
      )}

      {/* ── Risk gauge + key metrics ── */}
      <div style={styles.gaugeSection}>
        <RiskGauge
          riskScore={prediction.risk_score}
          confidence={prediction.confidence}
        />
        <div style={styles.metrics}>
          <MetricCard
            label="Risk Score"
            value={prediction.risk_score.toFixed(4)}
            sub="/ 1.000"
            highlight={riskColor(prediction.risk_score)}
          />
          <MetricCard
            label="Risk Level"
            value={prediction.risk_level}
            highlight={riskColor(prediction.risk_score)}
          />
          <MetricCard
            label="Confidence"
            value={`${(prediction.confidence * 100).toFixed(1)}%`}
            sub={confidenceLabel(prediction.confidence)}
          />
          <MetricCard
            label="Genes Analysed"
            value={Object.keys(genes).length}
          />
        </div>
      </div>

      <hr className="divider" />

      {/* ── Feature importances ── */}
      <SectionHeader icon="🧬" title="Gene Feature Importances" />
      <p style={styles.sectionDesc}>
        Signed impact scores indicate how each gene's expression level shifts the
        predicted risk.  Derived from mock SHAP-inspired weights (replace with
        real SHAP once trained model is integrated).
      </p>
      <GeneImpactChart impacts={feature_importances} />

      <hr className="divider" />

      {/* ── Heatmap ── */}
      <SectionHeader icon="🌡️" title="Expression Heatmap" />
      <p style={styles.sectionDesc}>
        Side-by-side comparison of patient expression vs the healthy reference baseline.
        Warm colours indicate elevated expression; cool colours indicate suppression.
      </p>
      <HeatmapViewer imageBase64={heatmap_base64} />

      <hr className="divider" />

      {/* ── Clinical interpretation ── */}
      <SectionHeader icon="📋" title="Clinical Interpretation" />
      <ClinicalInterpretation prediction={prediction} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }) {
  return (
    <div style={styles.sectionHeader}>
      <span>{icon}</span>
      <h3 style={styles.sectionTitle}>{title}</h3>
    </div>
  );
}

function MetricCard({ label, value, sub, highlight }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={{ ...styles.metricValue, color: highlight || '#e2e8f0' }}>
        {value}
        {sub && <span style={styles.metricSub}> {sub}</span>}
      </div>
    </div>
  );
}

function ClinicalInterpretation({ prediction }) {
  const { risk_level, risk_score, confidence } = prediction;

  const interpretations = {
    High: {
      color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)',
      icon: '🔴',
      heading: 'High Sepsis Risk Detected',
      body: 'The gene expression profile is consistent with an elevated inflammatory state. Pro-inflammatory markers (IL6, TNF, CXCL8) show significant upregulation while immune-regulatory markers (HLA-DRA) are suppressed — a pattern associated with sepsis-induced immunosuppression.',
      action: 'Immediate clinical evaluation is recommended. Consider confirmatory diagnostics (blood culture, procalcitonin, lactate) and sepsis bundle initiation per institutional protocol.',
    },
    Moderate: {
      color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)',
      icon: '🟡',
      heading: 'Moderate Risk — Close Monitoring Advised',
      body: 'The expression profile shows an intermediate inflammatory signal. Some pro-inflammatory pathways are activated but immune regulation is partially preserved. The pattern may indicate early-stage systemic inflammation or a resolving immune response.',
      action: 'Close clinical monitoring is advised. Serial sampling and repeat assessment in 12–24 hours may clarify the trajectory.',
    },
    Low: {
      color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)',
      icon: '🟢',
      heading: 'Low Risk — Routine Monitoring',
      body: 'The gene expression profile does not indicate significant inflammatory dysregulation. Immune-regulatory genes are within the expected range and pro-inflammatory markers are not substantially elevated.',
      action: 'Routine monitoring is appropriate. Re-assess if clinical condition changes.',
    },
  };

  const interp = interpretations[risk_level] || interpretations.Low;

  return (
    <div style={{ ...styles.interpBox, background: interp.bg, borderColor: interp.border }}>
      <div style={{ ...styles.interpHeading, color: interp.color }}>
        {interp.icon} {interp.heading}
      </div>
      <p style={styles.interpBody}>{interp.body}</p>
      <div style={styles.actionBox}>
        <span style={styles.actionLabel}>Recommended Action:</span> {interp.action}
      </div>
      <div style={styles.disclaimer}>
        ⚠ <strong>Research use only.</strong> This assessment is generated by an AI model and must
        not be used as the sole basis for clinical decision-making.
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function riskColor(score) {
  if (score >= 0.70) return '#ef4444';
  if (score >= 0.40) return '#f59e0b';
  return '#22c55e';
}

function confidenceLabel(c) {
  if (c >= 0.85) return 'High';
  if (c >= 0.70) return 'Moderate';
  return 'Low';
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  panel: { width: '100%' },
  loadingState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '3rem', gap: '1rem', textAlign: 'center',
  },
  spinner: {
    width: '48px', height: '48px',
    border: '3px solid #1e293b', borderTopColor: '#14b8a6',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#e2e8f0', fontSize: '1rem', fontWeight: 600, margin: 0 },
  loadingSubtext: { color: '#64748b', fontSize: '0.8rem', margin: 0 },
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '2.5rem 1.5rem', textAlign: 'center',
  },
  emptyTitle: { fontSize: '1.1rem', color: '#e2e8f0', marginBottom: '0.5rem' },
  emptyText: { fontSize: '0.875rem', color: '#64748b', maxWidth: '320px', lineHeight: 1.6, marginBottom: '1.25rem' },
  emptyBullets: { display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' },
  bullet: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#94a3b8' },
  bulletDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#14b8a6', flexShrink: 0 },
  headerRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  panelTitle: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#14b8a6', marginBottom: '0.25rem' },
  patientId: { fontSize: '0.85rem', color: '#94a3b8' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' },
  reportBtn: { fontSize: '0.82rem', padding: '0.45rem 1rem' },
  gaugeSection: {
    display: 'flex', gap: '1.5rem', alignItems: 'center',
    marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  metrics: {
    flex: 1, display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.65rem',
    minWidth: '200px',
  },
  metricCard: {
    background: '#0f172a', border: '1px solid #1e293b',
    borderRadius: '8px', padding: '0.75rem',
  },
  metricLabel: { fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' },
  metricValue: { fontSize: '1.15rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  metricSub: { fontSize: '0.7rem', color: '#64748b', fontFamily: 'Inter, sans-serif', fontWeight: 400 },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' },
  sectionTitle: { fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0' },
  sectionDesc: { fontSize: '0.8rem', color: '#64748b', marginBottom: '0.85rem', lineHeight: 1.6 },
  interpBox: {
    border: '1px solid', borderRadius: '10px',
    padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem',
  },
  interpHeading: { fontSize: '0.95rem', fontWeight: 700 },
  interpBody: { fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.65, margin: 0 },
  actionBox: {
    fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6,
    background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.6rem 0.8rem',
  },
  actionLabel: { fontWeight: 700, color: '#ffffff' },
  disclaimer: {
    fontSize: '0.75rem', color: '#f59e0b',
    background: 'rgba(245,158,11,0.08)', borderRadius: '6px',
    padding: '0.5rem 0.7rem', lineHeight: 1.5,
    border: '1px solid rgba(245,158,11,0.2)',
  },
};
