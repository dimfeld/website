import { RequestHandler } from '@sveltejs/kit';
import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
} from '$lib/readPosts.js';
import sorter from 'sorters';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get() {
  let posts = await readAllSources(postSources);
  posts.sort(sorter({ field: (p) => p.date, descending: true }));

  return {
    body: posts.map(stripContent),
  };
}
