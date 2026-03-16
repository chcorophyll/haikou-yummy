/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tesla inspired theme
        tesla: {
          dark: '#0e0e0e', // Very dark gray for background
          black: '#000000', // True black
          gray: '#1c1c1e', // Lighter panel gray
          red: '#e31937', // Tesla bright red accent
          light: '#f4f4f4', // Off white text
          muted: '#8e8e93', // Muted text
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'red-glow': '0 0 15px rgba(227, 25, 55, 0.3)',
      }
    },
  },
  plugins: [],
}
