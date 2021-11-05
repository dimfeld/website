import sveltePreprocess from 'svelte-preprocess';
import vercelAdapter from '@sveltejs/adapter-vercel';
import * as path from 'path';
import glob from 'glob';
import { string } from 'rollup-plugin-string';
import { hostname } from 'os';
import { fileURLToPath } from 'url';

const domain = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://${hostname()}:${process.env.DEV_PORT || process.env.PORT || 3000}`;
const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
export default {
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
        {
          name: 'watch-content',
          configureServer(server) {
            server.watcher.add(path.join(dirname, 'posts'));
            server.watcher.add(path.join(dirname, 'notes'));
            server.watcher.add(path.join(dirname, 'roam-pages'));
          },
          handleHotUpdate(ctx) {
            let m = /(notes|posts|roam-pages)\/(.*)\.(md|html)$/.exec(ctx.file);
            if (m) {
              let contentType = m[1];
              let id = m[2];
              if (contentType === 'roam-pages') {
                contentType = 'notes';
              } else if (contentType === 'posts') {
                contentType = 'writing';
              }

              ctx.server.ws.send({
                type: 'custom',
                event: 'content-update',
                data: {
                  type: contentType,
                  id,
                },
              });

              return [];
            }

            return ctx.modules;
          },
        },
      ],
    }),
  },
};
