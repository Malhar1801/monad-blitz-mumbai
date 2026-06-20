/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './context/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#F5F0E8',
        purple: '#7C3AED',
        black: '#0A0A0A',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'Courier New', 'monospace'],
      },
      borderWidth: {
        3: '3px',
      },
      boxShadow: {
        brutal: '4px 4px 0px #0A0A0A',
        'brutal-lg': '6px 6px 0px #0A0A0A',
        'brutal-sm': '2px 2px 0px #0A0A0A',
        'brutal-purple': '4px 4px 0px #7C3AED',
      },
    },
  },
  plugins: [],
};
