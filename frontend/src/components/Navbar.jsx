/**
 * components/Navbar.jsx
 * Sticky top navigation - biotech SaaS style.
 * Props: { onLogin, onSignup, onProfile, onGoHome }
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import UserMenu    from './UserMenu.jsx';

const NAV_LINKS = [
  { label: 'Home',     href: '#home'     },
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
];

export default function Navbar({ onLogin, onSignup, onProfile, onGoHome }) {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  function scrollTo(href) {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <header
      className="sticky top-0 z-50 transition-shadow duration-200"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        boxShadow: scrolled ? '0 1px 12px rgba(15,23,42,0.08)' : 'none',
      }}
    >
      <div className="max-w-content mx-auto px-6 h-16 flex items-center gap-6">

        {/* Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2.5 shrink-0 group mr-2"
        >
          <img src="/dna.png" alt="SepsisAI" className="w-7 h-7 object-contain" />
          <span
            className="font-bold text-lg tracking-tight transition-colors duration-150"
            style={{ color: '#1F3A5F' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#3A7CA5'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#1F3A5F'; }}
          >
            SepsisAI
          </span>
          <span
            className="hidden sm:inline-block text-xs font-semibold rounded-full px-2 py-0.5"
            style={{ background: '#EEF3F9', color: '#3A7CA5', border: '1px solid #B8D0E7' }}
          >
            Research Preview
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={e => { e.preventDefault(); scrollTo(href); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={{ color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1F3A5F'; e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
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
                  className="hidden sm:flex h-9 px-4 items-center text-sm font-semibold rounded-lg transition-all duration-150"
                  style={{ color: '#1F3A5F', border: '1px solid #E5E7EB' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F3A5F'; e.currentTarget.style.background = '#F8FAFC'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'transparent'; }}
                >
                  Sign In
                </button>
                <button
                  onClick={onSignup}
                  className="h-9 px-4 text-sm font-bold text-white rounded-lg transition-all duration-150"
                  style={{ background: '#1F3A5F', boxShadow: '0 2px 8px rgba(31,58,95,0.25)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#3A7CA5'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#1F3A5F'; }}
                >
                  Sign Up
                </button>
              </>
            )
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-150"
            style={{ border: '1px solid #E5E7EB', color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            aria-label="Menu"
          >
            {mobileOpen
              ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
              : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 py-4 space-y-1 animate-fade-in"
          style={{ background: '#FFFFFF', borderTop: '1px solid #F1F5F9' }}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={e => { e.preventDefault(); scrollTo(href); }}
              className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150"
              style={{ color: '#334155' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#1F3A5F'; e.currentTarget.style.background = '#F1F5F9'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent'; }}
            >
              {label}
            </a>
          ))}
          {!user && !loading && (
            <div className="pt-3 flex gap-2" style={{ borderTop: '1px solid #F1F5F9' }}>
              <button
                onClick={() => { setMobileOpen(false); onLogin?.(); }}
                className="flex-1 h-10 text-sm font-semibold rounded-lg transition-all"
                style={{ color: '#1F3A5F', border: '1px solid #E5E7EB' }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileOpen(false); onSignup?.(); }}
                className="flex-1 h-10 text-sm font-bold text-white rounded-lg transition-all"
                style={{ background: '#1F3A5F' }}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
