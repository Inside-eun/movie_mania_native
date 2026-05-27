/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111111',
        border: '#1f2937',
        primary: '#f97316',
        'primary-dark': '#ea580c',
      },
    },
  },
  plugins: [],
}

