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
 *   onGoHome      — navigates back to the landing page
 */
export default function ResultsDashboard({ results, onNewAnalysis, onGoHome }) {
  if (!results) return null;

  // All risk fields live inside the prediction envelope returned by /predict.
  // Top-level spread fallbacks retained for backwards compatibility.
  const prediction = results.prediction ?? {};
  const patientId        = results.patientId      ?? 'ANONYMOUS';
  const feature_importances = results.feature_importances ?? [];
  const genes            = results.genes           ?? {};
  const model_info       = results.model_info      ?? null;

  const finalRiskLevel  = prediction.risk_level  ?? results.risk_level  ?? 'Unknown';
  const finalRiskScore  = prediction.risk_score  ?? results.risk_score  ?? 0;
  const finalConfidence = prediction.confidence  ?? results.confidence  ?? null;
  const finalModelType  = prediction.model_type  ?? results.model_type  ?? 'Placeholder model (demo)';

  const predictionPayload = {
    risk_score:  finalRiskScore,
    risk_level:  finalRiskLevel,
    confidence:  finalConfidence,
    model_type:  finalModelType,
  };

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
            onClick={onGoHome}
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
            ← Home
          </button>
          <div style={{ width: 1, height: 14, background: 'var(--color-border)' }} />
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
            + New Analysis
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
          <span className={`badge badge-${finalRiskLevel.toLowerCase()}`}>
            {finalRiskLevel} Risk
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

        {/* ── Top row: Risk card + analysis summary ────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 360px) 1fr',
          gap: '1.25rem',
          marginBottom: '1.25rem',
          alignItems: 'start',
        }}>
          <RiskCard
            riskScore={finalRiskScore}
            riskLevel={finalRiskLevel}
            confidence={finalConfidence}
            modelType={finalModelType}
          />

          {/* Summary info card */}
          <div className="card fade-in" style={{ height: '100%' }}>
            <h3 className="card-title">Analysis Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <InfoRow label="Patient ID" value={patientId} mono />
              <InfoRow label="Risk Level" value={
                <span className={`badge badge-${finalRiskLevel.toLowerCase()}`}>{finalRiskLevel}</span>
              } />
              <InfoRow label="Risk Score" value={`${(finalRiskScore * 100).toFixed(1)}% (${finalRiskScore.toFixed(4)})`} mono />
              {finalConfidence != null && (
                <InfoRow label="Confidence" value={`${(finalConfidence * 100).toFixed(1)}%`} mono />
              )}
              <InfoRow label="Genes Analyzed" value={`${feature_importances.length} / 10`} />
              <InfoRow label="Model" value={finalModelType} />
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

        {/* ── Model Information Panel ───────────────────────────── */}
        <ModelInfoPanel modelType={finalModelType} genesCount={feature_importances.length} modelInfo={model_info} />

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

function ModelInfoPanel({ modelType, genesCount, modelInfo }) {
  const isPlaceholder = (modelType || '').toLowerCase().includes('placeholder');
  // Use server-provided model_info when available, fall back to client-side defaults
  const specs = [
    { label: 'Algorithm',       value: modelInfo?.algorithm      ?? (isPlaceholder ? 'Weighted Linear (placeholder)' : 'Random Forest Classifier') },
    { label: 'Genes Used',      value: `${modelInfo?.genes_used ?? genesCount} (10-gene transcriptomic panel)` },
    { label: 'Dataset Source',  value: modelInfo?.dataset_source ?? 'GEO Sepsis Dataset (GSE Cohorts)' },
    { label: 'Explainability',  value: modelInfo?.explainability ?? (isPlaceholder ? 'Mock SHAP-inspired scores' : 'SHAP TreeExplainer') },
    { label: 'Output',          value: 'Probability score [0–1] + categorical risk level' },
    { label: 'Model Status',    value: isPlaceholder ? '⚠ Placeholder active — not clinically trained' : '✓ Trained model active' },
  ];

  return (
    <div className="card fade-in" style={{ marginBottom: '1.25rem' }}>
      <h3 className="card-title" style={{ marginBottom: '1rem' }}>
        Model Information
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '0.75rem 1.5rem',
      }}>
        {specs.map(({ label, value }) => (
          <div key={label} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            paddingBottom: '0.6rem',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-navy)' }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {isPlaceholder && (
        <div style={{
          marginTop: '1rem',
          background: 'var(--color-accent-lt)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          fontSize: '0.78rem',
          color: 'var(--color-navy)',
          lineHeight: 1.6,
        }}>
          <strong>Developer note:</strong> The placeholder model uses biology-informed weights derived from sepsis literature.
          Drop a trained <code style={{ background: '#dbeafe', padding: '0.1em 0.35em', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>sepsis_model.pkl</code> into{' '}
          <code style={{ background: '#dbeafe', padding: '0.1em 0.35em', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>backend/models/</code> and restart the server to activate the real model.
          See README for integration instructions.
        </div>
      )}
    </div>
  );
}
