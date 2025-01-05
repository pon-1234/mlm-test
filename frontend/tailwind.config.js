/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx, ts}"],
  theme: {
    extend: {
      fontFamily: {
        NotoSansJP: 'NotoSansJP'
      },
      backgroundImage: {
        'SignBg': "url('/public/bg.svg')"
      },
      textColor: {
        'main': '#f47d31',
        'warning': '#ff0000'
      },
      backgroundColor: {
        'main': '#f47d31',
        'warning': '#ff0000'
      }
    },
  },
  plugins: [],
}