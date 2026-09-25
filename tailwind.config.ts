import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#fcf6f1',
          100: '#f8ebe1',
          200: '#f0d3bf',
          300: '#e6b796',
          400: '#d88f5a',
          500: '#cf7635',
          600: '#c9631a',
          700: '#ab5416',
          800: '#8d4512',
          900: '#6f360e'
        },
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        success: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a'
        },
        warning: {
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04'
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626'
        }
      },
      boxShadow: {
        soft: '0 28px 80px rgba(15, 23, 42, 0.12)',
        card: '0 20px 60px rgba(15, 23, 42, 0.08)'
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      }
    }
  },
  plugins: []
};

export default config;
