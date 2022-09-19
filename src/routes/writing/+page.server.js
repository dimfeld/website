import { stripContent, readAllSources, postSources } from '$lib/readPosts';
import sorter from 'sorters';

/**
 * @type {import('./$types').PageServerLoad}
 */
export async function load() {
  let posts = await readAllSources(postSources);
  posts.sort(
    sorter(
      { value: (p) => p.date, descending: true },
      { value: (p) => p.title }
    )
  );

  return {
    posts: posts.map(stripContent),
  };
}
