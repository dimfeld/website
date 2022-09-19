import { RequestHandler } from '@sveltejs/kit';
import { stripContent, readAllSources, postSources } from '$lib/readPosts';
import sorter from 'sorters';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function GET() {
  let posts = await readAllSources(postSources);
  posts.sort(
    sorter(
      { value: (p) => p.date, descending: true },
      { value: (p) => p.title }
    )
  );

  return {
    body: {
      posts: posts.map(stripContent),
    },
  };
}
