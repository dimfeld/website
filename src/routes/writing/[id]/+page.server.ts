import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { postSources, lookupContent } from '$lib/readPosts';
import md from '$lib/markdown';

export const load: PageServerLoad = async ({ params }) => {
  let post = lookupContent(postSources, params.id);
  if (!post) {
    throw error(404, 'not found');
  }

  const renderer = md();

  let content =
    post.format === 'md'
      ? renderer(post.content, {
          url: `/writing/${post.id}`,
        })
      : post.content;
  post = {
    ...post,
    content,
  };

  return { post };
};
