/**
 * components/UserMenu.jsx
 * Avatar + dropdown for logged-in users.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function UserMenu({ onProfile }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.name || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('');

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 group"
        title={user?.name}
      >
        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-bold shadow group-hover:ring-2 group-hover:ring-blue-300 transition-all">
          {initials}
        </div>
        <span className="text-sm font-semibold text-navy-700 max-w-[120px] truncate hidden sm:inline">
          {user?.name?.split(' ')[0]}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden animate-fade-in">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-navy-700 truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            {user?.blood_group && (
              <span className="inline-block mt-1 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                {user.blood_group}
              </span>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); onProfile?.(); }}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>👤</span> My Profile
          </button>

          <div className="border-t border-slate-100" />

          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <span>→</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
