module.exports = (env) => ({
  plugins: [
    require('postcss-import')(),
    require('postcss-url')(),
    require('postcss-nested'),
    require('tailwindcss')('./tailwind.config.js'),
    require('autoprefixer')(),
    env === 'production' ? require('cssnano') : false,
  ].filter(Boolean),
});
