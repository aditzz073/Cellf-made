import React from 'react';
import RiskCard from './RiskCard.jsx';
import GeneTable from './GeneTable.jsx';
import HeatmapViewer from './HeatmapViewer.jsx';
import ReportDownload from './ReportDownload.jsx';

/**
 * ResultsDashboard — full results page after analysis completes.
 *
 * Props:
 *   results       — full API response from /predict enriched with patientId
 *   onNewAnalysis — navigates back to input
 */
export default function ResultsDashboard({ results, onNewAnalysis }) {
  if (!results) return null;

  const {
    patientId      = 'ANONYMOUS',
    risk_level     = 'Unknown',
    risk_score     = 0,
    confidence     = null,
    model_type     = 'Placeholder model (demo)',
    feature_importances = [],
    genes          = {},
  } = results;

  const predictionPayload = { risk_score, risk_level, confidence, model_type };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' }}>

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 1.5rem',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={onNewAnalysis}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0',
            }}
          >
            ← New Analysis
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem' }}>🧬</span>
            <span style={{ fontWeight: 700, color: 'var(--color-navy)', fontSize: '1rem' }}>SepsisAI</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            Patient: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-navy)' }}>
              {patientId}
            </span>
          </span>
          <span className={`badge badge-${risk_level.toLowerCase()}`}>
            {risk_level} Risk
          </span>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '2rem 1.5rem 4rem', maxWidth: 960, width: '100%', margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>Sepsis Risk Assessment Results</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Transcriptomic analysis complete · {new Date().toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>

        {/* ── Top row: Risk card + model info ─────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 360px) 1fr',
          gap: '1.25rem',
          marginBottom: '1.25rem',
          alignItems: 'start',
        }}>
          <RiskCard
            riskScore={risk_score}
            riskLevel={risk_level}
            confidence={confidence}
            modelType={model_type}
          />

          {/* Summary info card */}
          <div className="card fade-in" style={{ height: '100%' }}>
            <h3 className="card-title">Analysis Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <InfoRow label="Patient ID" value={patientId} mono />
              <InfoRow label="Risk Level" value={
                <span className={`badge badge-${risk_level.toLowerCase()}`}>{risk_level}</span>
              } />
              <InfoRow label="Risk Score" value={`${(risk_score * 100).toFixed(1)}% (${risk_score.toFixed(4)})`} mono />
              {confidence != null && (
                <InfoRow label="Confidence" value={`${(confidence * 100).toFixed(1)}%`} mono />
              )}
              <InfoRow label="Genes Analyzed" value={`${feature_importances.length} / 10`} />
              <InfoRow label="Model" value={model_type} />
            </div>

            {/* Disclaimer */}
            <div style={{
              marginTop: '1.25rem',
              background: 'var(--color-risk-mod-bg)',
              border: '1px solid var(--color-risk-mod-bd)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              fontSize: '0.75rem',
              color: 'var(--color-risk-mod)',
              lineHeight: 1.55,
            }}>
              ⚠ For research use only. Not validated for clinical diagnosis or treatment decisions.
            </div>
          </div>
        </div>

        {/* ── Gene feature importance table ─────────────────── */}
        {feature_importances.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <GeneTable featureImportances={feature_importances} />
          </div>
        )}

        {/* ── Interactive heatmap ───────────────────────────── */}
        {feature_importances.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <HeatmapViewer featureImportances={feature_importances} />
          </div>
        )}

        {/* ── Report download ───────────────────────────────── */}
        <div className="card fade-in" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.4rem' }}>Clinical Report</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
            Download a structured PDF report for research documentation.
          </p>
          <ReportDownload
            patientId={patientId}
            genes={genes}
            prediction={predictionPayload}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '0.6rem',
      borderBottom: '1px solid var(--color-border)',
      gap: '0.75rem',
    }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, flexShrink: 0 }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--color-navy)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}
