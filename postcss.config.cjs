module.exports = (env) => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-url')(),
    require('tailwindcss/nesting'),
    require('tailwindcss')('./tailwind.config.cjs'),
    require('autoprefixer')(),
  ].filter(Boolean),
});
