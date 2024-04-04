import { vitePreprocess } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter(),
  },
};
