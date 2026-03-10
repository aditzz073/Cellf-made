/**
 * App.jsx — Root application component.
 *
 * View state machine:
 *   'landing'   → LandingPage
 *   'input'     → DataInput (3-tab input)
 *   'validating'→ ValidationStatus (animated client-side checks)
 *   'loading'   → LoadingScreen (API call in progress)
 *   'results'   → ResultsDashboard
 */

import React, { useState, useCallback } from 'react';
import LandingPage       from './components/LandingPage.jsx';
import DataInput         from './components/DataInput.jsx';
import ValidationStatus  from './components/ValidationStatus.jsx';
import LoadingScreen     from './components/LoadingScreen.jsx';
import ResultsDashboard  from './components/ResultsDashboard.jsx';
import { API, extractApiError } from './services/api.js';
import { GENE_PANEL } from './constants.js';

/**
 * Parses and validates an uploaded CSV File client-side.
 * Returns an array of step objects for ValidationStatus.
 */
async function buildFileValidationSteps(file) {
  const steps = [
    { label: 'File accepted', detail: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`, status: 'ok' },
  ];

  let text;
  try {
    text = await file.text();
  } catch {
    return [...steps, { label: 'Checking CSV format', detail: 'Could not read file.', status: 'error' }];
  }

  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return [...steps, { label: 'Checking CSV format', detail: 'File must have a header row and at least one data row.', status: 'error' }];
  }

  const header = lines[0].split(',').map(h => h.trim());
  const geneIdx = header.findIndex(h => h === 'Gene');
  const exprIdx = header.findIndex(h => h === 'Expression');
  if (geneIdx === -1 || exprIdx === -1) {
    return [...steps, { label: 'Checking CSV format', detail: `Required columns missing. Found: ${header.join(', ')}`, status: 'error' }];
  }
  steps.push({ label: 'Checking CSV format', detail: 'Gene and Expression columns present', status: 'ok' });

  const foundGenes = new Set(
    lines.slice(1).map(row => row.split(',')[geneIdx]?.trim()).filter(Boolean)
  );
  const missing = GENE_PANEL.filter(g => !foundGenes.has(g));
  if (missing.length > 0) {
    return [...steps, { label: 'Required gene panel check', detail: `Missing genes: ${missing.join(', ')}`, status: 'error' }];
  }
  steps.push({ label: 'Required gene panel check', detail: `All ${GENE_PANEL.length} required genes present`, status: 'ok' });
  steps.push({ label: 'Sending for backend validation', detail: 'Full validation performed server-side', status: 'ok' });
  return steps;
}

/** Builds validation steps for genes dict (manual / paste input). */
function buildGenesValidationSteps(data) {
  const geneCount  = Object.keys(data).length;
  const allPresent = GENE_PANEL.every(g => g in data);
  const allInRange = Object.values(data).every(v => v >= 0 && v <= 20);
  return [
    {
      label:  'Gene expression data loaded',
      detail: `${geneCount} gene values provided`,
      status: 'ok',
    },
    {
      label:  'Required gene panel check',
      detail: allPresent
        ? `All ${GENE_PANEL.length} required genes present`
        : `Missing: ${GENE_PANEL.filter(g => !(g in data)).join(', ')}`,
      status: allPresent ? 'ok' : 'error',
    },
    {
      label:  'Expression range check',
      detail: allInRange
        ? 'All values within valid log₂ range (0 – 20)'
        : 'Some values are out of the expected range',
      status: allInRange ? 'ok' : 'error',
    },
  ];
}

export default function App() {
  const [view,            setView]           = useState('landing');
  const [pendingData,     setPendingData]    = useState(null);  // { type, data, patientId }
  const [validationSteps, setValidationSteps]= useState([]);
  const [results,         setResults]        = useState(null);
  const [inputError,      setInputError]     = useState('');

  /* ── Called by DataInput when user submits ── */
  const handleDataSubmit = useCallback(async ({ type, data, patientId }) => {
    setInputError('');
    const steps = type === 'file'
      ? await buildFileValidationSteps(data)
      : buildGenesValidationSteps(data);
    const anyError = steps.some(s => s.status === 'error');

    if (anyError) {
      const failStep = steps.find(s => s.status === 'error');
      setInputError(failStep?.detail || 'Validation failed. Check your input and try again.');
      return;
    }

    setPendingData({ type, data, patientId });
    setValidationSteps(steps);
    setView('validating');
  }, []);

  /* ── Called by ValidationStatus when animation finishes ── */
  const handleValidationComplete = useCallback(async (allPassed) => {
    if (!allPassed || !pendingData) {
      setView('input');
      return;
    }
    setView('loading');
    try {
      let apiResult;
      if (pendingData.type === 'file') {
        apiResult = await API.predictFromFile(pendingData.data);
      } else {
        apiResult = await API.predictFromGenes(pendingData.data);
      }
      setResults({
        ...apiResult,
        patientId: pendingData.patientId || 'ANONYMOUS',
        genes: pendingData.type === 'genes'
          ? pendingData.data
          : apiResult.genes ?? {},
      });
      setView('results');
    } catch (err) {
      const msg = extractApiError(err);
      setInputError(typeof msg === 'string' ? msg : 'Analysis failed. Please check the backend and try again.');
      setView('input');
    }
  }, [pendingData]);

  /* ── View router ── */
  switch (view) {
    case 'landing':
      return <LandingPage onStart={() => setView('input')} />;

    case 'input':
      return (
        <DataInput
          onSubmit={handleDataSubmit}
          onBack={() => { setView('landing'); setInputError(''); }}
          externalError={inputError}
          onClearError={() => setInputError('')}
        />
      );

    case 'validating':
      return (
        <ValidationStatus
          steps={validationSteps}
          onComplete={handleValidationComplete}
        />
      );

    case 'loading':
      return <LoadingScreen />;

    case 'results':
      return (
        <ResultsDashboard
          results={results}
          onNewAnalysis={() => {
            setResults(null);
            setPendingData(null);
            setInputError('');
            setView('input');
          }}
          onGoHome={() => {
            setResults(null);
            setPendingData(null);
            setInputError('');
            setView('landing');
          }}
        />
      );

    default:
      return <LandingPage onStart={() => setView('input')} />;
  }
}

