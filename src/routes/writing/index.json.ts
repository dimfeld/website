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
  posts.sort(
    sorter(
      { value: (p) => p.date, descending: true },
      { value: (p) => p.title }
    )
  );

  return {
    body: posts.map(stripContent),
  };
}
