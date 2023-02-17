const defaultTheme = require('tailwindcss/defaultTheme');
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    './src/**/*.{svelte,pcss,css,js,ts}',
    './pkm-pages/**/*.html',
    './posts/*',
    './notes/*',
  ],
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
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {
              color: theme('colors.teal.700'),
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            'li > h1': {
              marginBottom: '0.25rem',
            },
            'li > h2': {
              marginBottom: '0.25rem',
            },
            'li > h3': {
              marginBottom: '0.25rem',
            },
            'li > h4': {
              marginBottom: '0.25rem',
            },
            h1: {
              color: theme('colors.teal.900'),
              fontWeight: 500,
              fontSize: theme('fontSize.3xl')[0],
              fontFamily: theme('fontFamily.sans').join(', '),
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            h2: {
              color: theme('colors.teal.900'),
              fontWeight: 500,
              fontSize: theme('fontSize.2xl')[0],
              fontFamily: theme('fontFamily.sans').join(', '),
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            h3: {
              color: theme('colors.teal.900'),
              fontWeight: 500,
              fontSize: theme('fontSize.xl')[0],
              fontFamily: theme('fontFamily.sans').join(', '),
              marginTop: '0.8rem',
              marginBottom: '0.8rem',
            },
            h4: {
              color: theme('colors.teal.900'),
              fontWeight: 500,
              fontSize: theme('fontSize.lg')[0],
              fontFamily: theme('fontFamily.sans').join(', '),
              marginTop: '0.6rem',
              marginBottom: '0.6rem',
            },
            'article h1': {
              fontSize: theme('fontSize.4xl')[0],
            },
            'article h2': {
              fontSize: theme('fontSize.3xl')[0],
            },
            'article h3': {
              fontSize: theme('fontSize.2xl')[0],
            },
            'article h4': {
              fontSize: theme('fontSize.xl')[0],
            },
            'article h2 + *': {
              marginTop: '0',
            },
            'article h3 + *': {
              marginTop: '0',
            },
            'article h4 + *': {
              marginTop: '0',
            },
            blockquote: {
              marginLeft: '-0.5rem',
              borderLeftWidth: '4px',
              borderColor: theme('colors.teal.600'),
              paddingLeft: '0.75rem',
              paddingRight: '1rem',
              fontStyle: 'italic',
              fontWeight: 'inherit',
            },
            pre: {
              fontFamily: theme('fontFamily.mono').join(', '),
              fontSize: theme('fontSize.base')[0],
              boxDecorationBreak: 'clone',
              backgroundColor: theme('colors.gray.200'),
              borderColor: theme('colors.gray.300'),
              color: theme('colors.black'),
              boxShadow: theme('boxShadow.lg'),
              lineHeight: theme('lineHeight.snug'),
              padding: '0.5rem',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            code: {
              backgroundColor: theme('colors.gray.200'),
              color: theme('colors.teal.900'),
              fontSize: 'inherit',
              fontWeight: 400,
              padding: '0 0.25rem',
            },
            'code::before': {
              content: '',
            },
            'code::after': {
              content: '',
            },
          },
        },
      }),
    },
  },
  corePlugins: {
    // Interferes with Svelte REPL
    container: false,
  },
  variants: {},
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
