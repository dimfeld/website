import { RequestHandler } from '@sveltejs/kit';
import { stripContent, readAllSources, noteSources } from '$lib/readPosts';
import sorter from 'sorters';

export const get: RequestHandler = async function get() {
  let notes = await readAllSources(noteSources);
  notes.sort(
    sorter(
      { value: (p) => p.updated || p.date, descending: true },
      { value: (p) => p.title }
    )
  );

  return {
    body: {
      notes: notes.map(stripContent),
    },
  };
};
