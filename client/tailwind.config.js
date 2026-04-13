/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        base: '#080a0f',
        surface: '#0d1117',
        elevated: '#111827',
        card: '#161b22',
      },
      boxShadow: {
        'neon-indigo': '0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.15)',
        'neon-cyan': '0 0 20px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.15)',
        'neon-sm': '0 0 10px rgba(99,102,241,0.25)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.35), 0 0 20px rgba(99,102,241,0.15)',
        'panel': '0 4px 16px rgba(0,0,0,0.3)',
        'modal': '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
};
