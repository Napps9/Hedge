/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f5f5f5',
        border: '#d4d4d4',
        muted: '#737373',
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1.1', fontWeight: '200' }],
        headline: ['1.75rem', { lineHeight: '1.2', fontWeight: '300' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dot: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out',
        'dot-1': 'dot 1.4s ease-in-out infinite',
        'dot-2': 'dot 1.4s ease-in-out 0.2s infinite',
        'dot-3': 'dot 1.4s ease-in-out 0.4s infinite',
      },
    },
  },
  plugins: [],
};
