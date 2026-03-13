/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#137fec',
        'background-light': '#f6f7f8',
        'background-dark': '#101922',
        'brand-teal-dark': '#163333',
        'brand-teal-accent': '#0d9488',
        'brand-cream': '#fdfbf7',
        'brand-cream-dark': '#f5f1ea',
        'road-black': '#1a1c1e',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
