/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: '#0f172a',
        accent: '#22c55e',
      },
    },
  },
  plugins: [],
};
