import sveltePreprocess from 'svelte-preprocess';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { string } from 'rollup-plugin-string';
import { hostname } from 'os';

let domain = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://${hostname()}:${process.env.DEV_PORT || process.env.PORT || 3000}`;

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Need an actual preprocess key here to make editor plugins work
  preprocess: [
    sveltePreprocess({
      postcss: true,
      aliases: [['ts', 'typescript']],
    }),
  ],
  kit: {
    adapter: vercelAdapter(),
    vite: () => ({
      define: {
        'process.env.SITE_DOMAIN': `"${domain}"`,
      },
      ssr: {
        noExternal: ['sorters'],
      },
      optimizeDeps: {
        include: [
          'codemirror',
          'codemirror/mode/javascript/javascript.js',
          'codemirror/mode/handlebars/handlebars.js',
          'codemirror/mode/htmlmixed/htmlmixed.js',
          'codemirror/mode/xml/xml.js',
          'codemirror/mode/css/css.js',
          'codemirror/mode/markdown/markdown.js',
          'codemirror/addon/edit/closebrackets.js',
          'codemirror/addon/edit/closetag.js',
          'codemirror/addon/edit/continuelist.js',
          'codemirror/addon/comment/comment.js',
          'codemirror/addon/fold/foldcode.js',
          'codemirror/addon/fold/foldgutter.js',
          'codemirror/addon/fold/brace-fold.js',
          'codemirror/addon/fold/xml-fold.js',
          'codemirror/addon/fold/indent-fold.js',
          'codemirror/addon/fold/markdown-fold.js',
          'codemirror/addon/fold/comment-fold.js',
        ],
      },
      plugins: [
        string({
          include: ['**/*.html', '**/*.md', '**/*.txt'],
        }),
      ],
    }),
  },
};

export default config;
