/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    container: {
        center: true
    },
    extend: {
        screens: {
            "3xl": "1840px",
            "4xl": "2480px",
            "5xl": "3860px"
        },

        gridColumn: {
            'span-37': 'span 37 / span 37',
          },

        gridTemplateColumns: {
            '21': 'repeat(21, minmax(0, 1fr))',
            '40': 'repeat(40, minmax(0, 1fr))'
        }
    },
  },
  plugins: [],
  darkMode: "selector"
}

