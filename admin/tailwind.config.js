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
          600: '#C0B39A',
          700: '#A4957A',
          800: '#85775F',
          900: '#665A45',
          DEFAULT: '#FBF9F5'
        },
        sand: {
          50: '#FAF9F6',
          100: '#F5F2EB',
          200: '#E8E2D5',
          300: '#DDD5C4',
          400: '#C9BEA7',
          500: '#B5A78C',
          600: '#9B8D73',
          700: '#7E715B',
          800: '#625746',
          900: '#463D31',
          DEFAULT: '#F5F2EB'
        },
        charcoal: {
          50: '#F5F5F4',
          100: '#E7E5E4',
          200: '#D6D3D1',
          300: '#A8A29E',
          400: '#78716C',
          500: '#57534E',
          600: '#44403C',
          700: '#292524',
          800: '#1C1917',
          900: '#0C0A09',
          950: '#050505',
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
          800: '#5F4627',
          900: '#47341D',
          DEFAULT: '#B48B57'
        },
        gold: {
          50: '#FDFBF0',
          100: '#FAF4D8',
          200: '#F4E7A7',
          300: '#EDDA76',
          400: '#E6CD45',
          500: '#D4AF37',
          600: '#B89326',
          700: '#8C6F1D',
          800: '#604C14',
          900: '#34290B',
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
