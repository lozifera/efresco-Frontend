/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'efresco-green': '#22c55e',
        'efresco-dark': '#16a34a',
      }
    },
  },
  plugins: [],
}

