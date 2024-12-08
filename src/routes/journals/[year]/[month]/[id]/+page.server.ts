import type { PageServerLoad } from './$types';
import { journalSources, lookupContent } from '$lib/readPosts';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = ({ params }) => {
  let post = lookupContent(journalSources, params.id);
  if (!post) {
    error(404, 'not found');
  }

  return {
    post,
  };
};
