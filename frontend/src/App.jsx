/**
 * App.jsx — Root application component.
 *
 * View state machine:
 *   'landing'   → LandingPage
 *   'login'     → LoginPage
 *   'signup'    → SignupPage
 *   'profile'   → ProfilePage
 *   'input'     → DataInput (3-tab input)
 *   'validating'→ ValidationStatus (animated client-side checks)
 *   'loading'   → LoadingScreen (API call in progress)
 *   'results'   → ResultsDashboard
 */

import React, { useState, useCallback } from 'react';
import { AuthProvider }  from './context/AuthContext.jsx';
import LandingPage       from './components/LandingPage.jsx';
import LoginPage         from './pages/LoginPage.jsx';
import SignupPage        from './pages/SignupPage.jsx';
import ProfilePage       from './pages/ProfilePage.jsx';
import DataInput         from './components/DataInput.jsx';
import ValidationStatus  from './components/ValidationStatus.jsx';
import LoadingScreen     from './components/LoadingScreen.jsx';
import ResultsDashboard  from './components/ResultsDashboard.jsx';
import { API, extractApiError } from './services/api.js';

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
    return [...steps, { label: 'Checking CSV format', detail: 'CSV must include a header row and at least one data row.', status: 'error' }];
  }

  const header = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());

  // Accept long-format GEO CSVs (ProbeID + Expression columns)
  const isLongFormat = header.includes('ProbeID') || header.includes('Expression');
  // Also accept wide-format V-feature CSVs
  const vFeatureCols = header.filter(h => /^V\d+$/i.test(h));

  if (!isLongFormat && vFeatureCols.length === 0) {
    return [
      ...steps,
      {
        label: 'Checking CSV format',
        detail: 'Expected either a ProbeID/Expression long-format GEO CSV or a wide-format CSV with V-feature columns.',
        status: 'error',
      },
    ];
  }

  if (isLongFormat) {
    steps.push({ label: 'Checking CSV format', detail: `Long-format GEO CSV detected (${lines.length - 1} probe rows)`, status: 'ok' });
  } else {
    steps.push({ label: 'Checking CSV format', detail: `Wide-format CSV detected (${vFeatureCols.length} V-feature columns)`, status: 'ok' });
  }

  steps.push({ label: 'Sending for backend validation', detail: 'Full validation performed server-side', status: 'ok' });
  return steps;
}

/** Builds validation steps for feature dict (paste input). */
function buildFeaturesValidationSteps(data) {
  const featureCount = Object.keys(data).length;
  const allNumeric = Object.values(data).every(v => Number.isFinite(v));
  return [
    {
      label:  'Feature payload loaded',
      detail: `${featureCount} feature values provided`,
      status: 'ok',
    },
    {
      label:  'Numeric value check',
      detail: allNumeric ? 'All parsed feature values are numeric' : 'One or more feature values are non-numeric',
      status: allNumeric ? 'ok' : 'error',
    },
  ];
}

function AppInner() {
  const [view,            setView]           = useState('landing');
  const [prevView,        setPrevView]       = useState('landing'); // for profile back nav
  const [pendingData,     setPendingData]    = useState(null);  // { type, data, patientId }
  const [validationSteps, setValidationSteps]= useState([]);
  const [results,         setResults]        = useState(null);
  const [inputError,      setInputError]     = useState('');

  function goTo(v) { setPrevView(view); setView(v); }

  /* ── Called by DataInput when user submits ── */
  const handleDataSubmit = useCallback(async ({ type, data, patientId }) => {
    setInputError('');
    const steps = type === 'file'
      ? await buildFileValidationSteps(data)
      : buildFeaturesValidationSteps(data);
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
        apiResult = await API.predictFromFeatures(pendingData.data);
      }
      // Backend returns either `features` (new) or `genes` (legacy).
      // For paste input the user's own feature dict is used as the gene map.
      const resolvedFeatures =
        pendingData.type === 'features'
          ? pendingData.data
          : (apiResult.features ?? apiResult.genes ?? {});

      setResults({
        ...apiResult,
        patientId: pendingData.patientId || 'ANONYMOUS',
        genes: resolvedFeatures,   // ResultsDashboard reads results.genes
        features: resolvedFeatures, // keep both keys for forward-compat
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
      return (
        <LandingPage
          onStart={() => setView('input')}
          onLogin={() => goTo('login')}
          onSignup={() => goTo('signup')}
          onProfile={() => goTo('profile')}
        />
      );

    case 'login':
      return (
        <LoginPage
          onSuccess={() => setView('landing')}
          onGoSignup={() => setView('signup')}
          onGoHome={() => setView('landing')}
        />
      );

    case 'signup':
      return (
        <SignupPage
          onSuccess={() => setView('landing')}
          onGoLogin={() => setView('login')}
          onGoHome={() => setView('landing')}
        />
      );

    case 'profile':
      return (
        <ProfilePage
          onBack={() => setView(prevView === 'profile' ? 'landing' : (prevView || 'landing'))}
        />
      );

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
      return <LandingPage onStart={() => setView('input')} onLogin={() => goTo('login')} onSignup={() => goTo('signup')} onProfile={() => goTo('profile')} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

