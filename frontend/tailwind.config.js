/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Minimals-inspired palette for Fleet Budget
        primary: {
          main: '#00A76F',
          dark: '#007867',
          light: '#5BE49B',
          lighter: '#C8FAD6',
          subtle: 'rgba(0, 167, 111, 0.08)',
        },
        error: {
          main: '#FF5630',
          light: '#FFE9D5',
          dark: '#B71D18',
          subtle: 'rgba(255, 86, 48, 0.08)',
        },
        warning: {
          main: '#FFAB00',
          light: '#FFF5CC',
          dark: '#B76E00',
          subtle: 'rgba(255, 171, 0, 0.08)',
        },
        success: {
          main: '#22C55E',
          light: '#D3FCD2',
        },
        info: {
          main: '#00B8D9',
          light: '#CAFDF5',
        },
        // Warm neutrals (Minimals signature)
        neutral: {
          900: '#141A21',
          800: '#1C252E',
          700: '#454F5B',
          600: '#637381',
          500: '#919EAB',
          400: '#C4CDD5',
          300: '#DFE3E8',
          200: '#F4F6F8',
          100: '#F9FAFB',
        },
        // Sidebar
        sidebar: {
          DEFAULT: '#1C252E',
          hover: 'rgba(145, 158, 171, 0.08)',
          active: 'rgba(0, 167, 111, 0.08)',
        },
      },
      fontFamily: {
        sans: ['"Public Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0px 0px 2px rgba(145, 158, 171, 0.2), 0px 12px 24px -4px rgba(145, 158, 171, 0.12)',
        dropdown: '0px 0px 2px rgba(145, 158, 171, 0.24), 0px 20px 40px -4px rgba(145, 158, 171, 0.24)',
        primary: '0 8px 16px rgba(0, 167, 111, 0.24)',
        error: '0 8px 16px rgba(255, 86, 48, 0.24)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}
