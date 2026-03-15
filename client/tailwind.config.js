/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        surface: '#fafafa',
        border: '#e5e5e5',
        muted: '#999999',
        subtle: '#f5f5f5',
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display',
          'Segoe UI', 'system-ui', 'sans-serif',
        ],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', fontWeight: '200' }],
        'headline': ['1.75rem', { lineHeight: '1.2', fontWeight: '300' }],
        'title': ['1.25rem', { lineHeight: '1.3', fontWeight: '400' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'micro': ['0.6875rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse3: {
          '0%, 80%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '40%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-1': 'pulse3 1.4s ease-in-out infinite',
        'pulse-2': 'pulse3 1.4s ease-in-out 0.2s infinite',
        'pulse-3': 'pulse3 1.4s ease-in-out 0.4s infinite',
      },
    },
  },
  plugins: [],
};
