/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rar: {
          900: '#1a1612',
          800: '#2d2420',
          700: '#3d3229',
          600: '#4d4035',
          accent: '#ff6b35',
        }
      }
    },
  },
  plugins: [],
}