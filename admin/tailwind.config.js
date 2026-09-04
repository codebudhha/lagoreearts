/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#FDFCF9',
          100: '#FBF9F5',
          200: '#F7F4EE',
          300: '#EFEAE0',
          400: '#E7E0D1',
          500: '#D8CEBA',
          DEFAULT: '#FBF9F5'
        },
        charcoal: {
          50: '#78716C',
          100: '#57534E',
          200: '#44403C',
          300: '#292524',
          400: '#1C1917',
          500: '#0C0A09',
          DEFAULT: '#1C1917'
        },
        champagne: {
          50: '#FBF7F0',
          100: '#F5ECE0',
          200: '#EAD7BF',
          300: '#DEC29E',
          400: '#D2AD7D',
          500: '#B48B57', // Primary Brand Gold
          600: '#967243',
          700: '#785A32',
          DEFAULT: '#B48B57'
        },
        gold: {
          light: '#E5C478',
          DEFAULT: '#D4AF37',
          dark: '#AA820A'
        },
        border: {
          light: '#EFEAE0',
          DEFAULT: '#E7E2D9',
          dark: '#D8D2C5'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Cinzel', '"Playfair Display"', 'serif']
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        card: '0 2px 8px 0 rgba(28, 25, 23, 0.04)',
        modal: '0 10px 25px -5px rgba(28, 25, 23, 0.1), 0 8px 10px -6px rgba(28, 25, 23, 0.06)'
      }
    },
  },
  plugins: [],
}
