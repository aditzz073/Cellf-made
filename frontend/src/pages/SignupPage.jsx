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

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md animate-fade-in">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-md mb-4"
              style={{ background: '#1F3A5F' }}>
              <img src="/dna.png" alt="SepsisAI" className="w-9 h-9 object-contain" />
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#0F172A' }}>Create account</h1>
            <p style={{ color: '#475569', fontSize: '0.9375rem' }}>Start predicting sepsis risk with AI</p>
          </div>

          <div className="rounded-xl p-8" style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)' }}>
            <form onSubmit={submit} className="space-y-5">

              <div>
                <label className="block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Full Name
                </label>
                <input
                  type="text" name="name" autoComplete="name"
                  value={form.name} onChange={handle} placeholder="Dr. Jane Smith"
                  className="w-full h-11 px-4 rounded-lg text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #E5E7EB', fontSize: '0.9375rem' }}
                  onFocus={e => { e.target.style.borderColor = '#5DA9E9'; e.target.style.boxShadow = '0 0 0 3px rgba(93,169,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
              </div>

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
                  type="password" name="password" autoComplete="new-password"
                  value={form.password} onChange={handle} placeholder="Minimum 8 characters"
                  className="w-full h-11 px-4 rounded-lg text-sm outline-none transition-all"
                  style={{ border: '1.5px solid #E5E7EB', fontSize: '0.9375rem' }}
                  onFocus={e => { e.target.style.borderColor = '#5DA9E9'; e.target.style.boxShadow = '0 0 0 3px rgba(93,169,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                />
                {pwStrength && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                      <div className={`h-full rounded-full transition-all ${strengthMeta[pwStrength].bar}`} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{strengthMeta[pwStrength].label}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block mb-2" style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Blood Group <span style={{ color: '#CBD5E1', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <select
                  name="blood_group" value={form.blood_group} onChange={handle}
                  className="w-full h-11 px-4 rounded-lg text-sm outline-none transition-all bg-white"
                  style={{ border: '1.5px solid #E5E7EB', fontSize: '0.9375rem', color: '#0F172A' }}
                  onFocus={e => { e.target.style.borderColor = '#5DA9E9'; e.target.style.boxShadow = '0 0 0 3px rgba(93,169,233,0.15)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg || '- Select -'}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="rounded-lg px-4 py-3 text-sm flex items-start gap-2"
                  style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }}>
                  <span className="mt-0.5"><AlertIcon /></span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                style={{ background: loading ? '#3A7CA5' : '#1F3A5F', color: '#fff', boxShadow: '0 2px 8px rgba(31,58,95,0.25)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#3A7CA5'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#1F3A5F'; }}>
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</>
                ) : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-6 text-center" style={{ borderTop: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                Already have an account?{' '}
                <button onClick={onGoLogin} className="font-semibold transition-colors"
                  style={{ color: '#3A7CA5' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#1F3A5F'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#3A7CA5'; }}>
                  Sign in
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
