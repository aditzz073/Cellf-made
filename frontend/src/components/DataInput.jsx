import React, { useState } from 'react';
import CSVUpload from './CSVUpload.jsx';
import ManualInputForm, { emptyGenes, ALL_GENES } from './ManualInputForm.jsx';
import PasteCSV from './PasteCSV.jsx';
import { GENE_PANEL as REQUIRED_GENES } from '../constants.js';

const TABS = [
  { id: 'upload', label: 'Upload CSV',    icon: '📂' },
  { id: 'manual', label: 'Manual Entry',  icon: '✏️' },
  { id: 'paste',  label: 'Paste CSV',     icon: '📋' },
];

/**
 * DataInput — three-tab gene expression input page.
 *
 * Props:
 *   onSubmit({ type, data, patientId })
 *   onBack()
 *   externalError — string
 *   onClearError()
 */
export default function DataInput({ onSubmit, onBack, externalError, onClearError }) {
  const [tab,           setTab]           = useState('upload');
  const [patientId,     setPatientId]     = useState('');
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [manualValues,  setManualValues]  = useState(emptyGenes());
  const [pastedGenes,   setPastedGenes]   = useState(null);
  const [fieldErrors,   setFieldErrors]   = useState({});
  const [submitError,   setSubmitError]   = useState('');

  function validateManual(vals) {
    const errs = {};
    for (const gene of REQUIRED_GENES) {
      const raw = vals[gene];
      if (raw === '' || raw == null) { errs[gene] = 'required'; continue; }
      const n = parseFloat(raw);
      if (isNaN(n))         { errs[gene] = 'not a number'; continue; }
      if (n < 0 || n > 20)  { errs[gene] = '0–20'; }
    }
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');
    setFieldErrors({});

    if (tab === 'upload') {
      if (!selectedFile) { setSubmitError('Please select a CSV file.'); return; }
      onSubmit({ type: 'file', data: selectedFile, patientId });
      return;
    }

    if (tab === 'manual') {
      const errs = validateManual(manualValues);
      if (Object.keys(errs).length) {
        setFieldErrors(errs);
        setSubmitError('Please fill in all gene values within the valid range (0–20).');
        return;
      }
      const genes = Object.fromEntries(REQUIRED_GENES.map(g => [g, parseFloat(manualValues[g])]));
      onSubmit({ type: 'genes', data: genes, patientId });
      return;
    }

    if (tab === 'paste') {
      if (!pastedGenes || Object.keys(pastedGenes).length === 0) {
        setSubmitError('Please paste and parse your CSV data first.');
        return;
      }
      const missing = REQUIRED_GENES.filter(g => !(g in pastedGenes));
      if (missing.length) {
        setSubmitError(`Missing required genes: ${missing.join(', ')}`);
        return;
      }
      onSubmit({ type: 'genes', data: pastedGenes, patientId });
    }
  }

  function switchTab(id) {
    setTab(id);
    setSubmitError('');
    setFieldErrors({});
    onClearError?.();
  }

  const isReady = (
    (tab === 'upload' && selectedFile != null) ||
    (tab === 'manual' && ALL_GENES.every(g => manualValues[g] !== '' && manualValues[g] != null)) ||
    (tab === 'paste'  && pastedGenes && Object.keys(pastedGenes).length >= 10)
  );

  const errorMsg = submitError || externalError;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-slate-500 hover:text-navy-700 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="text-lg">🧬</span>
              <span className="font-bold text-navy-700 text-base">SepsisAI</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">New Analysis</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">

        {/* Page title */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-navy-700 mb-1.5">Gene Expression Input</h2>
          <p className="text-sm text-slate-500">
            Provide transcriptomic data for the 10-gene diagnostic panel using one of the methods below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Patient ID */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-wrap items-end gap-5">
              <div className="flex-1 min-w-[220px]">
                <label htmlFor="patient-id" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Patient / Sample ID <span className="text-slate-400 font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="patient-id"
                  type="text"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm font-mono text-navy-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                  placeholder="e.g. PT-2024-001"
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  maxLength={64}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed pb-0.5 max-w-xs">
                Used to label the PDF report. Anonymized if left blank.
              </p>
            </div>
          </div>

          {/* Input tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              {TABS.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all border-b-2 ${
                    tab === t.id
                      ? 'border-blue-600 text-blue-700 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">
              {tab === 'upload' && (
                <CSVUpload onFileSelected={setSelectedFile} selectedFile={selectedFile} />
              )}
              {tab === 'manual' && (
                <ManualInputForm
                  values={manualValues}
                  errors={fieldErrors}
                  onGenesChange={vals => { setManualValues(vals); setFieldErrors({}); }}
                />
              )}
              {tab === 'paste' && (
                <PasteCSV
                  onGenesChange={g => { setPastedGenes(g); setSubmitError(''); }}
                  onClearGenes={() => setPastedGenes(null)}
                />
              )}
            </div>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12} y2={16} />
              </svg>
              <p className="text-sm text-red-700 leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="submit"
              onClick={() => { if (externalError) onClearError?.(); }}
              className="w-full max-w-md inline-flex items-center justify-center gap-2 bg-navy-700 hover:bg-blue-800 text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run Sepsis Risk Analysis
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <p className="text-xs text-slate-400">
              Analysis typically completes in under 5 seconds
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
