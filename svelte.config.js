const sveltePreprocess = require('svelte-preprocess');
const { mdsvex } = require('mdsvex');

const highlight = require('highlight.js');
const footnote = require('markdown-it-footnote');
const abbr = require('markdown-it-abbr');
const toc = require('markdown-it-toc-done-right');
const anchor = require('markdown-it-anchor');

const dev = process.env.NODE_ENV === 'development';

module.exports = {
  // Need an actual preprocess key here to make editor plugins work
  preprocess: [
    sveltePreprocess({
      postcss: require('./postcss.config'),
      typescript: {
        transpileOnly: true,
      },
      aliases: [['ts', 'typescript']],
    }),
    mdsvex({
      extension: '.svx',
      parser: (md) =>
        md
          .use(footnote)
          .use(abbr)
          .use(toc)
          .use(anchor),
      markdownOptions: {
        linkify: true,
        highlight: function(str, lang) {
          if (lang && highlight.getLanguage(lang)) {
            try {
              return highlight.highlight(lang, str).value;
            } catch (__) {}
          }

          return ''; // use external default escaping
        },
      },
    }),
  ],
};
