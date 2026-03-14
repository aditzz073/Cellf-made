/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        /* ── Biotech brand palette ── */
        primary: {
          DEFAULT: '#1F3A5F',
          50:  '#EEF3F9',
          100: '#D4E2EF',
          200: '#A9C4DF',
          300: '#7EA7CF',
          400: '#5389C0',
          500: '#3A7CA5',
          600: '#2E6489',
          700: '#1F3A5F',
          800: '#162A46',
          900: '#0D1B2D',
        },
        secondary: {
          DEFAULT: '#3A7CA5',
          light:   '#5DA9E9',
        },
        accent:  '#5DA9E9',
        /* ── Neutral / surface ── */
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F8FAFC',
          2:       '#F1F5F9',
        },
        border:  '#E5E7EB',
        /* ── Semantic text ── */
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#475569',
          dim:     '#94A3B8',
        },
        /* ── Risk ── */
        risk: {
          high:    '#DC2626',
          highBg:  '#FEF2F2',
          highBd:  '#FECACA',
          mod:     '#D97706',
          modBg:   '#FFFBEB',
          modBd:   '#FED7AA',
          low:     '#16A34A',
          lowBg:   '#F0FDF4',
          lowBd:   '#BBF7D0',
        },
        /* ── Legacy navy (keep for back-compat with existing components) ── */
        navy: {
          50:  '#f0f4f9',
          100: '#dce8f3',
          200: '#b8d0e7',
          300: '#85afd4',
          500: '#2a6aa3',
          600: '#1e5287',
          700: '#1F3A5F',
          800: '#162A46',
          900: '#0D1B2D',
          DEFAULT: '#1F3A5F',
        },
      },
      fontSize: {
        'hero':    ['52px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '800' }],
        'section': ['34px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'sub':     ['21px', { lineHeight: '1.4',  fontWeight: '600' }],
        'body':    ['16px', { lineHeight: '1.65' }],
        'small':   ['14px', { lineHeight: '1.6'  }],
        'xs2':     ['12px', { lineHeight: '1.5'  }],
      },
      borderRadius: {
        'card': '12px',
        'pill': '999px',
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)',
        'card-hover': '0 4px 24px rgba(15,23,42,0.12)',
        'btn':     '0 2px 8px rgba(31,58,95,0.25)',
        'btn-hover':'0 4px 14px rgba(31,58,95,0.35)',
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-out',
        'fade-up':    'fadeUp 0.5s ease-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                                   '100%': { opacity: '1' } },
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' },    '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' },    '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      maxWidth: {
        'content': '1200px',
      },
    },
  },
  plugins: [],
};
