import type { PageServerLoad } from './$types';
import { stripContent, readAllSources, postSources } from '$lib/readPosts';
import sorter from 'sorters';
import { createTagsLookup } from '$lib/tags';

export const load: PageServerLoad = () => {
  let posts = readAllSources(postSources);
  posts.sort(
    sorter(
      { value: (p) => p.date, descending: true },
      { value: (p) => p.title }
    )
  );

  return {
    posts: posts.map(stripContent),
    tags: createTagsLookup(posts),
  };
};
