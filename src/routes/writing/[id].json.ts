import { RequestHandler } from '@sveltejs/kit';
import { postSources, lookupContent } from '$lib/readPosts.js';
import md from '$lib/markdown.js';
import { readDevTo } from '$lib/devto';

export const get: RequestHandler = async function get({ params: { id } }) {
  let post = await lookupContent(postSources, id);
  if (!post) {
    return;
  }

  let devToList = await readDevTo();
  let devToArticle = devToList.find((a) => a.post_id === id);

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
    devto: devToArticle,
  };

  return {
    body: post as any,
  };
};
