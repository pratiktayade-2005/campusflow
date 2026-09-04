/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        ink: {
          900: '#0f1222',
          800: '#1a1d2e',
          700: '#262a3e',
          600: '#3a3f57',
          500: '#5c6178',
          400: '#868ba3',
          300: '#b3b7c9',
          200: '#d8dae6',
          100: '#eceefa',
          50: '#f6f7fc',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Sora', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,18,34,0.06)',
        elevated: '0 8px 24px rgba(15,18,34,0.08)',
        deep: '0 20px 48px rgba(15,18,34,0.14)',
      },
    },
  },
  plugins: [],
};
