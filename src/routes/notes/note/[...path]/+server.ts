import { error, json, type RequestHandler } from '@sveltejs/kit';
import { noteSources, lookupContent } from '$lib/readPosts';
import md from '$lib/markdown';

export const GET: RequestHandler = async function GET({ params: { path } }) {
  if (path.endsWith('.json')) {
    path = path.slice(0, -5);
  }
  let note = await lookupContent(noteSources, path);
  if (!note) {
    throw error(404, 'Note not found');
  }

  const renderer = md();

  let content =
    note.format === 'md'
      ? renderer(note.content, {
          url: `/notes/${note.id}`,
        })
      : note.content;
  note = {
    ...note,
    content,
  };

  return json({ note });
};
