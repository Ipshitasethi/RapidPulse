/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#6C47FF',
          light: '#8B6EFF',
          dark: '#4F2FD4',
          accent: '#00D4AA',
          coral: '#FF6B6B',
        },
        dark: {
          bg: '#0A0A0F',
          card: '#12121A',
          elevated: '#1A1A2E',
        },
        severity: {
          5: '#FF3B3B',
          4: '#FF8C00',
          3: '#FFD700',
          2: '#00C853',
          1: '#7B61FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.02em',
      }
    },
  },
  plugins: [],
}
