const sveltePreprocess = require('svelte-preprocess');
const dev = process.env.NODE_ENV === 'development';

module.exports = {
  // Need an actual preprocess key here to make editor plugins work
  preprocess: [
    sveltePreprocess({
      postcss: true,
      aliases: [['ts', 'typescript']],
    }),
  ],
};
