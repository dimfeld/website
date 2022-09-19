import { RequestHandler } from '@sveltejs/kit';
import { postSources, lookupContent } from '$lib/readPosts';
import md from '$lib/markdown';

export const GET: RequestHandler = async function GET({ params: { id } }) {
  let post = await lookupContent(postSources, id);
  if (!post) {
    return {
      status: 404,
    };
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

  return {
    body: { post } as any,
  };
};
