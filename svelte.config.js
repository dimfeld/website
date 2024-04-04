import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: [vitePreprocess()],
  kit: {
    adapter: adapter({
      routes: {
        include: ['/repl/*', '/plas/*', '/og-image/*'],
        exclude: [
          '/about',
          '/about/*',
          '/work',
          '/journals',
          '/journals/*',
          '/notes',
          '/notes/*',
          '/projects',
          '/projects/*',
          '/rss/*',
          '/work',
          '/work/*',
          '/writing',
          '/writing/*',
          '<files>',
          '<build>',
        ],
      },
    }),
  },
};
