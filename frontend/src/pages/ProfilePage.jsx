/**
 * pages/ProfilePage.jsx
 * View and update the logged-in user's profile.
 */
import React, { useState } from 'react';
import { useAuth }    from '../context/AuthContext.jsx';
import { AuthAPI }    from '../services/authApi.js';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfilePage({ onBack }) {
  const { user, refreshUser, logout } = useAuth();

  const [form, setForm] = useState({
    name:             user?.name         ?? '',
    blood_group:      user?.blood_group  ?? '',
    current_password: '',
    new_password:     '',
  });

  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  const [showPwSection, setShowPwSection] = useState(false);

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  }

  async function save(e) {
    e.preventDefault();
    if (showPwSection) {
      if (!form.current_password) { setError('Current password is required to change password.'); return; }
      if (!form.new_password || form.new_password.length < 8) {
        setError('New password must be at least 8 characters.'); return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim()    || undefined,
        blood_group: form.blood_group    || undefined,
      };
      if (showPwSection && form.current_password && form.new_password) {
        payload.current_password = form.current_password;
        payload.new_password     = form.new_password;
      }
      await AuthAPI.updateProfile(payload);
      await refreshUser();
      setSuccess('Profile updated successfully.');
      setForm(f => ({ ...f, current_password: '', new_password: '' }));
      setShowPwSection(false);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(' · ') : (detail ?? 'Update failed.'));
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-700 transition-colors font-medium"
            >
              ← Back
            </button>
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2.5">
              <img src="/dna.png" alt="SepsisAI" className="w-6 h-6 object-contain" />
              <span className="font-bold text-navy-700 text-lg tracking-tight">SepsisAI</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full">
            Research Preview v1.0
          </span>
        </div>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10 space-y-6">

        {/* Avatar banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-navy-700 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-navy-700 truncate">{user?.name ?? '—'}</h1>
            <p className="text-sm text-slate-500 truncate">{user?.email ?? '—'}</p>
            {user?.blood_group && (
              <span className="inline-block mt-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                {user.blood_group}
              </span>
            )}
          </div>
          <div className="ml-auto shrink-0">
            <button
              onClick={logout}
              className="text-sm text-slate-400 hover:text-red-500 transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Edit form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-base font-bold text-navy-700 mb-6">Edit Profile</h2>

          <form onSubmit={save} className="space-y-5">

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handle}
                className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className="w-full h-11 px-4 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">Email cannot be changed.</p>
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
                  <option key={bg} value={bg}>{bg || '— Not specified —'}</option>
                ))}
              </select>
            </div>

            {/* Password change toggle */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPwSection(v => !v)}
                className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                {showPwSection ? '− Cancel password change' : '+ Change password'}
              </button>
            </div>

            {showPwSection && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={form.current_password}
                    onChange={handle}
                    autoComplete="current-password"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={form.new_password}
                    onChange={handle}
                    autoComplete="new-password"
                    placeholder="Minimum 8 characters"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-0.5">⚠</span> {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                <span>✓</span> {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-12 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : 'Save Changes'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
