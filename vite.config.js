import { sveltekit } from '@sveltejs/kit/vite';
import wasm from 'vite-plugin-wasm';

import * as path from 'path';
import { string } from 'rollup-plugin-string';
import { hostname } from 'os';
import { fileURLToPath } from 'url';

const domain =
  process.env.VERCEL_ENV === 'production'
    ? 'https://imfeld.dev'
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://${hostname()}:${
        process.env.DEV_PORT || process.env.PORT || 5173
      }`;
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
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
    wasm(),
    sveltekit(),
    string({
      include: ['**/*.html', '**/*.md', '**/*.txt'],
    }),
    {
      name: 'watch-content',
      configureServer(server) {
        server.watcher.add(path.join(dirname, 'posts'));
        server.watcher.add(path.join(dirname, 'notes'));
        server.watcher.add(path.join(dirname, 'pkm-pages'));
      },
      handleHotUpdate(ctx) {
        let m =
          /(notes|posts|pkm-pages\/notes|pkm-pages\/journals|pkm-pages\/writing)\/(.*)\.(md|html)$/.exec(
            ctx.file
          );
        if (m) {
          let contentType = m[1];
          let id = m[2];
          if (contentType === 'pkm-pages/notes') {
            contentType = 'notes';
          } else if (contentType === 'pkm-pages/journals') {
            contentType = 'journals';
          } else if (contentType === 'pkm-pages/writing') {
            contentType = 'writing';
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
};
