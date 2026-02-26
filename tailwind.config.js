/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'oda-ink': '#2C2C2C',        // Primary text
        'oda-paper': '#F9F7F1',      // Background
        'oda-surface': '#FFFEFA',    // Card background
        'oda-pencil': '#8C867D',     // Secondary text
        'oda-wax': '#A84438',        // Accent/CTA
      },
      fontFamily: {
        'display': ['CormorantGaramond_700Bold_Italic'],
        'body': ['EBGaramond_400Regular'],
        'body-italic': ['EBGaramond_400Regular_Italic'],
        'ui': ['Montserrat_500Medium'],
      },
      aspectRatio: {
        'poem-card': '3 / 4',
      },
    },
  },
  plugins: [],
}

