const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
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
