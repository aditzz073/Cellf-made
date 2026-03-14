/**
 * pages/LoginPage.jsx
 * Email + password login form.
 */
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage({ onSuccess, onGoSignup, onGoHome }) {
  const { login } = useAuth();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      onSuccess?.();
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8FAFC' }}>

      {/* Header */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}
        className="sticky top-0 z-50">
        <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onGoHome} className="flex items-center gap-2.5">
            <img src="/dna.png" alt="SepsisAI" className="w-7 h-7 object-contain" />
            <span className="font-bold text-lg tracking-tight" style={{ color: '#1F3A5F' }}>SepsisAI</span>
          </button>
          <span className="hidden sm:inline-block text-xs font-semibold rounded-full px-3 py-1"
            style={{ background: '#EEF3F9', color: '#3A7CA5', border: '1px solid #B8D0E7' }}>
            Research Preview
          </span>
        </div>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-md mb-4"
              style={{ background: '#1F3A5F' }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Welcome back</h1>
            <p style={{ color: '#475569', fontSize: '0.9375rem' }}>Sign in to your SepsisAI account</p>
          </div>

          <div className="rounded-xl p-8" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)' }}>
            <form onSubmit={submit} className="space-y-5">

              <div>
                <label className="block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <input
                  type="email" name="email" autoComplete="email"
                  value={form.email} onChange={handle} placeholder="you@example.com"
                  className="w-full h-11 px-4 rounded-lg text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #E5E7EB', fontSize: '0.9375rem' }}
                  onFocus={e => { e.target.style.borderColor = '#5DA9E9'; e.target.style.boxShadow = '0 0 0 3px rgba(93,169,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password" name="password" autoComplete="current-password"
                  value={form.password} onChange={handle} placeholder="••••••••"
                  className="w-full h-11 px-4 rounded-lg text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #E5E7EB', fontSize: '0.9375rem' }}
                  onFocus={e => { e.target.style.borderColor = '#5DA9E9'; e.target.style.boxShadow = '0 0 0 3px rgba(93,169,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm flex items-center gap-2"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <AlertIcon /> {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                style={{ background: loading ? '#3A7CA5' : '#1F3A5F', color: '#fff', boxShadow: '0 2px 8px rgba(31,58,95,0.25)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3A7CA5'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1F3A5F'; }}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                Don't have an account?{' '}
                <button onClick={onGoSignup} className="font-semibold transition-colors"
                  style={{ color: '#3A7CA5' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1F3A5F'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#3A7CA5'; }}>
                  Create account
                </button>
              </p>
            </div>
          </div>

          <p className="text-center mt-6" style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
            For research use only · Not a clinical diagnostic tool
          </p>
        </div>
      </div>
    </div>
  );
}

const AlertIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
