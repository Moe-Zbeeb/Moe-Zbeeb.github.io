/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        aub: {
          maroon: '#8C1D18',
          beige: '#E6D3B1',
          navy: '#1C1F26',
          gold: '#C9A24D',
          offwhite: '#F5F5F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
};
