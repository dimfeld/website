import sveltePreprocess from 'svelte-preprocess';
import vercelAdapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [
    sveltePreprocess({
      postcss: true,
    }),
  ],
  kit: {
    adapter: vercelAdapter(),
  },
};
