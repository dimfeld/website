module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'prettier/@typescript-eslint',
  ],
  plugins: ['svelte3'],
  overrides: [
    {
      files: ['**/*.svelte'],
      processor: 'svelte3/svelte3',
      settings: {
        'svelte3/ignore-styles': (attrs) => attrs.type === 'text/postcss',
      },
    },
  ],
  rules: {
    eqeqeq: 'error',
    'no-unused-vars': 'warn',
  },
};
