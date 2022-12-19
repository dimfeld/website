import { vitePreprocess } from '@sveltejs/kit/vite';
import vercelAdapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: vercelAdapter(),
  },
};
