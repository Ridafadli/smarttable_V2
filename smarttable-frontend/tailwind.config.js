/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          emphasis: '#4f46e5',
          muted: '#eef2ff',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
        },
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-light':
          'radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(59, 130, 246, 0.05) 0px, transparent 50%)',
        'mesh-dark':
          'radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%), radial-gradient(at 0% 80%, rgba(59, 130, 246, 0.06) 0px, transparent 50%)',
        'hero-gradient': 'linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #7c3aed 100%)',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.04)',
        sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        card: '0 0 0 1px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 0 0 1px rgba(15, 23, 42, 0.08), 0 4px 8px rgba(15, 23, 42, 0.04), 0 16px 40px rgba(15, 23, 42, 0.08)',
        glow: '0 0 0 1px rgba(99, 102, 241, 0.2), 0 8px 32px rgba(99, 102, 241, 0.18)',
        'glow-sm': '0 0 24px rgba(99, 102, 241, 0.12)',
        sidebar: '1px 0 0 0 rgba(15, 23, 42, 0.06)',
        'dark-card': '0 0 0 1px rgba(255, 255, 255, 0.05), 0 4px 24px rgba(0, 0, 0, 0.32)',
        'dark-card-hover': '0 0 0 1px rgba(255, 255, 255, 0.08), 0 8px 32px rgba(0, 0, 0, 0.4)',
        inner: 'inset 0 1px 2px rgba(15, 23, 42, 0.06)',
      },
      keyframes: {
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(16px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateX(0) scale(1)' },
        },
        'page-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
        'toast-progress': {
          from: { width: '100%' },
          to: { width: '0%' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slide-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.35s ease-out forwards',
        'scale-in': 'scale-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'page-in': 'page-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'toast-progress': 'toast-progress 4.5s linear forwards',
      },
    },
  },
  plugins: [],
};
