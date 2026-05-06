/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tiktok: {
          red: '#FE2C55',
          black: '#010101',
          dark: '#1a1a2e',
          darker: '#0f0f1a'
        }
      }
    },
  },
  plugins: [],
}
