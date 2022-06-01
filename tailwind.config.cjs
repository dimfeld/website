const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{svelte,pcss,css,js,ts}', './posts/*', './notes/*'],
  theme: {
    extend: {
      colors: {
        indigo: colors.indigo,
        teal: {
          50: '#edfafa',
          100: '#d5f5f6',
          200: '#afecef',
          300: '#7edce2',
          400: '#16bdca',
          500: '#0694a2',
          600: '#047481',
          700: '#036672',
          800: '#05505c',
          900: '#014451',
        },
        gray: colors.gray,
      },
      fontFamily: {
        serif: ['Merriweather', ...defaultTheme.fontFamily.serif],
        mono: ['Inconsolata', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  corePlugins: {
    // Interferes with Svelte REPL
    container: false,
  },
  variants: {},
  plugins: [require('@tailwindcss/forms')],
};
