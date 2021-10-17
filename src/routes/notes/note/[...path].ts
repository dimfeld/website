import { RequestHandler } from '@sveltejs/kit';
import { noteSources, lookupContent } from '$lib/readPosts.js';
import md from '$lib/markdown.js';

export const get: RequestHandler = async function get({ params: { id } }) {
  let note = await lookupContent(noteSources, id);
  if (!note) {
    return;
  }

  const renderer = md();

  let content =
    note.format === 'md'
      ? renderer(note.content, {
          url: `/writing/${note.id}`,
        })
      : note.content;
  note = {
    ...note,
    content,
  };

  return {
    body: note as any,
  };
};
