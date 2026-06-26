/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B00',
        background: '#08080F',
        text: '#F1F1F1',
        muted: '#6B6B7B',
        card: '#0F0F1A',
        border: 'rgba(255,255,255,0.07)',
        borderMd: 'rgba(255,255,255,0.1)',
        'orange-light': 'rgba(255,107,0,0.1)',
        'orange-lighter': 'rgba(255,107,0,0.25)',
        'orange-hover': 'rgba(255,107,0,0.3)',
        'gray-code': '#1A1A2A',
        'gray-tip': '#4B4B5B',
      },
    },
  },
  plugins: [],
};
