const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  purge: false,
  theme: {
    extend: {
      fontFamily: {
        serif: ['Merriweather', ...defaultTheme.fontFamily.serif],
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/ui')],
};
