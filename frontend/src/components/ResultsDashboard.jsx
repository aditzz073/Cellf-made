import React, { useState } from 'react';
import RiskCard              from './RiskCard.jsx';
import ConfidenceIndicator   from './ConfidenceIndicator.jsx';
import GeneSignatureExplorer from './GeneSignatureExplorer.jsx';
import HeatmapViewer         from './HeatmapViewer.jsx';
import CohortComparison      from './CohortComparison.jsx';
import ReportDownload        from './ReportDownload.jsx';
import { useAuth }           from '../context/AuthContext.jsx';

/**
 * ResultsDashboard — cBioPortal-style results page.
 *
 * Props:
 *   results       — API response from /predict enriched with patientId
 *   onNewAnalysis — back to input view
 *   onGoHome      — back to landing page
 */
export default function ResultsDashboard({ results, onNewAnalysis, onGoHome }) {
  const [mode, setMode] = useState('clinical'); // 'clinical' | 'research'
  const { user } = useAuth();
  if (!results) return null;

  // Normalize from prediction envelope (with top-level fallbacks)
  const prediction = results.prediction ?? {};
  const patientId           = results.patientId && results.patientId !== 'ANONYMOUS'
    ? results.patientId
    : (user?.name ?? 'Anonymous');
  const feature_importances = results.feature_importances ?? [];
  const genes               = results.genes               ?? {};
  const model_info          = results.model_info          ?? null;

  const finalRiskLevel  = prediction.risk_level  ?? results.risk_level  ?? 'Unknown';
  const finalRiskScore  = prediction.risk_score  ?? results.risk_score  ?? 0;
  const finalConfidence = prediction.confidence  ?? results.confidence  ?? null;
  const finalModelType  = prediction.model_type  ?? results.model_type  ?? 'Placeholder model (demo)';

  const predictionPayload = {
    risk_score: finalRiskScore,
    risk_level: finalRiskLevel,
    confidence: finalConfidence,
    model_type: finalModelType,
  };

  const riskBadgeCls =
    finalRiskLevel === 'High'     ? 'bg-red-50 text-red-700 border-red-200'   :
    finalRiskLevel === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-green-50 text-green-700 border-green-200';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Sticky Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoHome}
              className="flex items-center gap-1.5 text-slate-500 hover:text-navy-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Home
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <button
              onClick={onNewAnalysis}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              + New Analysis
            </button>
          </div>

          {/* Center: logo */}
          <div className="hidden sm:flex items-center gap-2">
            <img src="/dna.png" alt="SepsisAI" className="w-5 h-5 object-contain" />
            <span className="font-bold text-navy-700 text-base">SepsisAI</span>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <span className="text-xs text-slate-400 font-mono">
              Patient: <strong className="text-navy-700">{patientId}</strong>
            </span>
          </div>

          {/* Right: mode toggle + risk badge */}
          <div className="flex items-center gap-3">
            {/* Clinical / Research toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group">
              {[['clinical', 'Clinical'], ['research', 'Research']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setMode(val)}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-md transition-all ${
                    mode === val
                      ? 'bg-white text-navy-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className={`hidden sm:inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${riskBadgeCls}`}>
              {finalRiskLevel} Risk
            </span>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-5">

        {/* Page title row */}
        <div>
          <h2 className="text-xl font-bold text-navy-700">Sepsis Risk Assessment</h2>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;·&nbsp;
            {mode === 'clinical' ? 'Clinical overview' : 'Full research dashboard'}
          </p>
        </div>

        {/* ── Top row: Risk Card + Summary + Confidence ── */}
        <div className="grid lg:grid-cols-5 gap-5 items-start">
          {/* Risk card */}
          <div className="lg:col-span-2">
            <RiskCard
              riskScore={finalRiskScore}
              riskLevel={finalRiskLevel}
              confidence={finalConfidence}
              modelType={finalModelType}
            />
          </div>

          {/* Summary + confidence stacked */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Analysis summary */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-4">
                Analysis Summary
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
                {[
                  { label: 'Patient ID',       value: patientId,                                                mono: true },
                  { label: 'Risk Level',        value: finalRiskLevel,                                          color: finalRiskLevel === 'High' ? '#dc2626' : finalRiskLevel === 'Moderate' ? '#d97706' : '#16a34a' },
                  { label: 'Risk Score',        value: `${(finalRiskScore * 100).toFixed(1)}% (${finalRiskScore.toFixed(4)})`,  mono: true },
                  { label: 'Confidence',        value: finalConfidence != null ? `${Math.round(finalConfidence * 100)}%` : 'N/A', mono: true },
                  { label: 'Top Features',      value: `${feature_importances.length}` },
                  { label: 'Model',             value: finalModelType },
                ].map(({ label, value, mono, color }) => (
                  <div key={label} className="border-b border-slate-100 pb-2.5">
                    <p className="text-[11px] text-slate-400 font-medium mb-0.5">{label}</p>
                    <p
                      className={`text-sm font-semibold text-navy-700 ${mono ? 'font-mono' : ''}`}
                      style={color ? { color } : {}}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

            </div>

            {/* Confidence indicator */}
            <ConfidenceIndicator confidence={finalConfidence} modelType={finalModelType} />
          </div>
        </div>

        {/* ── Gene Signature Explorer (always shown) ── */}
        {feature_importances.length > 0 && (
          <GeneSignatureExplorer featureImportances={feature_importances} />
        )}

        {/* ── Research-mode extras ── */}
        {mode === 'research' && (
          <>
            {/* Interactive heatmap */}
            {feature_importances.length > 0 && (
              <HeatmapViewer featureImportances={feature_importances} />
            )}

            {/* Cohort comparison + Model info */}
            <div className="grid lg:grid-cols-2 gap-5">
              <CohortComparison riskScore={finalRiskScore} featureImportances={feature_importances} />
              <ModelInfoPanel
                modelType={finalModelType}
                genesCount={feature_importances.length}
                modelInfo={model_info}
              />
            </div>
          </>
        )}

        {/* ── Download Report ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
          <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-1.5">
            Clinical Report
          </p>
          <h3 className="text-lg font-bold text-navy-700 mb-1.5">Download Research Report</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Generate a structured PDF report with gene expression profile, risk score,
            feature importances, and clinical disclaimer.
          </p>
          <ReportDownload patientId={patientId} genes={genes} prediction={predictionPayload} />
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-400 pb-4">
          SepsisAI Research Preview · For investigational use only · Not a medical device
        </p>
      </div>
    </div>
  );
}

/* ── ModelInfoPanel (internal to this file) ── */
function ModelInfoPanel({ modelType, genesCount, modelInfo }) {
  const isPlaceholder = (modelType || '').toLowerCase().includes('placeholder');
  const specs = [
    { label: 'Algorithm',      value: modelInfo?.algorithm      ?? (isPlaceholder ? 'Placeholder' : 'Random Forest + StandardScaler') },
    { label: 'Features Used',  value: `${modelInfo?.genes_used  ?? genesCount}` },
    { label: 'Dataset Source', value: modelInfo?.dataset_source ?? 'GEO Sepsis Dataset (GSE Cohorts)' },
    { label: 'Explainability', value: modelInfo?.explainability ?? 'Model importance x normalized deviation' },
    { label: 'Output Type',    value: 'Probability [0–1] + risk classification' },
    { label: 'Status',         value: isPlaceholder ? 'Placeholder active' : 'Trained model active' },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <p className="text-[10px] font-bold tracking-widest uppercase text-blue-600 mb-0.5">
          Model Information
        </p>
        <p className="text-xs text-slate-500">Research credibility &amp; model provenance</p>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        {specs.map(({ label, value }) => (
          <div key={label} className="border-b border-slate-100 pb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-navy-700 leading-snug">{value}</p>
          </div>
        ))}
      </div>
      {isPlaceholder && (
        <div className="px-5 pb-5">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-navy-700 leading-relaxed">
            Place both model artifacts in backend/models and restart backend: sepsis_rf_model.pkl and sepsis_scaler.pkl.
          </div>
        </div>
      )}
    </div>
  );
}
