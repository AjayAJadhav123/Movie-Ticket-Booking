/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#e50914', // Cinebook red
        secondary: '#ec4899',
        dark: '#0a0a0a', // Deep dark background
        card: '#141414', // Slightly lighter dark for cards
      },
    },
  },
  plugins: [],
}
