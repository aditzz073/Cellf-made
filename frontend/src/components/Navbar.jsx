/**
 * components/Navbar.jsx
 * Sticky top navigation bar with auth-aware right section.
 */
import React, { useState } from 'react';
import { useAuth }   from '../context/AuthContext.jsx';
import UserMenu      from './UserMenu.jsx';

const NAV_LINKS = [
  { label: 'Home',     href: '#home'     },
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
];

export default function Navbar({ onLogin, onSignup, onProfile, onGoHome }) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function scrollTo(href) {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 shrink-0 group mr-2"
        >
          <img src="/dna.png" alt="SepsisAI" className="w-7 h-7 object-contain" />
          <span className="font-bold text-navy-700 text-lg tracking-tight group-hover:text-blue-700 transition-colors">
            SepsisAI
          </span>
        </button>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={e => { e.preventDefault(); scrollTo(href); }}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-navy-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Right section */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {!loading && (
            user ? (
              <UserMenu onProfile={onProfile} />
            ) : (
              <>
                <button
                  onClick={onLogin}
                  className="hidden sm:flex h-9 px-4 items-center text-sm font-semibold text-navy-700 border border-slate-300 rounded-lg hover:border-navy-700 hover:bg-slate-50 transition-all"
                >
                  Sign In
                </button>
                <button
                  onClick={onSignup}
                  className="h-9 px-4 text-sm font-bold text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </>
            )
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-1 animate-fade-in">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={e => { e.preventDefault(); scrollTo(href); }}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-navy-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {label}
            </a>
          ))}
          {!user && !loading && (
            <div className="pt-2 flex gap-2">
              <button onClick={() => { setMobileOpen(false); onLogin?.(); }}
                className="flex-1 h-9 text-sm font-semibold text-navy-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all">
                Sign In
              </button>
              <button onClick={() => { setMobileOpen(false); onSignup?.(); }}
                className="flex-1 h-9 text-sm font-bold text-white bg-navy-700 rounded-lg hover:bg-navy-800 transition-all">
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
