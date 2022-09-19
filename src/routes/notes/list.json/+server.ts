import { RequestHandler } from '@sveltejs/kit';
import { stripContent, readAllSources, noteSources } from '$lib/readPosts';
import sorter from 'sorters';

export const GET: RequestHandler = async function GET() {
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
