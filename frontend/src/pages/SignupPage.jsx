/**
 * pages/SignupPage.jsx
 * Account creation form.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function SignupPage({ onSuccess, onGoLogin, onGoHome }) {
  const { signup } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', blood_group: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  const pwStrength = form.password.length === 0 ? null
    : form.password.length < 8  ? 'weak'
    : form.password.length < 12 ? 'fair'
    : 'strong';

  const strengthMeta = {
    weak:   { label: 'Too short (min 8)',  bar: 'w-1/4 bg-red-400' },
    fair:   { label: 'Fair',               bar: 'w-2/4 bg-yellow-400' },
    strong: { label: 'Strong',             bar: 'w-full bg-green-500' },
  };

  async function submit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        blood_group: form.blood_group || null,
      });
      onSuccess?.();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg).join(' · '));
      } else {
        setError(detail ?? 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2.5 group">
            <img src="/dna.png" alt="SepsisAI" className="w-6 h-6 object-contain" />
            <span className="font-bold text-navy-700 text-lg tracking-tight group-hover:text-blue-700 transition-colors">SepsisAI</span>
          </button>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            Research Preview v1.0
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-700 rounded-2xl shadow-lg mb-4">
              <img src="/dna.png" alt="SepsisAI" className="w-9 h-9 object-contain" />
            </div>
            <h1 className="text-2xl font-bold text-navy-700 mb-1">Create account</h1>
            <p className="text-slate-500 text-sm">Start predicting sepsis risk with AI</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <form onSubmit={submit} className="space-y-5">

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={form.name}
                  onChange={handle}
                  placeholder="Dr. Jane Smith"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handle}
                  placeholder="Minimum 8 characters"
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                />
                {pwStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strengthMeta[pwStrength].bar}`} />
                    </div>
                    <p className="text-xs text-slate-400">{strengthMeta[pwStrength].label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Blood Group <span className="text-slate-300 font-normal normal-case">(optional)</span>
                </label>
                <select
                  name="blood_group"
                  value={form.blood_group}
                  onChange={handle}
                  className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg || '— Select —'}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account…
                  </>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  onClick={onGoLogin}
                  className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            For research use only · Not a clinical diagnostic tool
          </p>
        </div>
      </div>
    </div>
  );
}
