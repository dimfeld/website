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
      plugins: [
        string({
          include: ['**/*.html', '**/*.md'],
        }),
      ],
    }),
  },
};

export default config;
