import sveltePreprocess from 'svelte-preprocess';
import vercelAdapter from '@sveltejs/adapter-vercel';

let domain = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://${require('os').hostname()}:${
      process.env.DEV_PORT || process.env.PORT || 3000
    }`;

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
    define: {
      'process.env.SITE_DOMAIN': domain,
    },
  },
};

export default config;
