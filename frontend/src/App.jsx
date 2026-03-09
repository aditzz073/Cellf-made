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

const REQUIRED_GENES = ['IL6', 'TLR4', 'HLA-DRA', 'STAT3', 'TNF', 'CXCL8', 'CD14', 'MMP8', 'LBP', 'PCSK9'];

/** Builds the validation step objects shown in ValidationStatus */
function buildValidationSteps(type, data) {
  if (type === 'file') {
    return [
      { label: 'File accepted',               detail: `${data.name} (${(data.size / 1024).toFixed(1)} KB)`, status: 'ok' },
      { label: 'Checking CSV format',          detail: 'Gene and Expression columns present',                status: 'ok' },
      { label: 'Sending for backend validation', detail: 'Full validation performed server-side',            status: 'ok' },
    ];
  }
  // genes dict
  const geneCount  = Object.keys(data).length;
  const present    = REQUIRED_GENES.filter(g => g in data);
  const allPresent = present.length === REQUIRED_GENES.length;
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
        ? `All ${REQUIRED_GENES.length} required genes present`
        : `Missing: ${REQUIRED_GENES.filter(g => !(g in data)).join(', ')}`,
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
  const handleDataSubmit = useCallback(({ type, data, patientId }) => {
    setInputError('');
    const steps = buildValidationSteps(type, data);
    const anyError = steps.some(s => s.status === 'error');

    if (anyError) {
      // Surface error back to DataInput rather than showing the animation
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
        />
      );

    default:
      return <LandingPage onStart={() => setView('input')} />;
  }
}

