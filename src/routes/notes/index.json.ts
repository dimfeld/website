import { RequestHandler } from '@sveltejs/kit';
import { stripContent, readAllSources, noteSources } from '$lib/readPosts.js';
import sorter from 'sorters';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get() {
  let notes = await readAllSources(noteSources);
  notes.sort(sorter({ field: (p) => p.date, descending: true }));

  return {
    body: notes.map(stripContent),
  };
}
