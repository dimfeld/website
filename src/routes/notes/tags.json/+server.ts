import { json } from '@sveltejs/kit';
import { RequestHandler } from '@sveltejs/kit';
import { noteSources, lookupContent, readAllSources } from '$lib/readPosts';
import capitalize from 'just-capitalize';
import { formatTag } from '$lib/tags';

export const GET: RequestHandler = async function GET({ params: { id } }) {
  let notes = await readAllSources(noteSources);

  let output: Record<string, { posts: string[] }> = {};
  for (let note of notes) {
    for (let tag of note.tags) {
      tag = formatTag(tag).replace(/[^a-zA-Z0-9]/g, '-');
      let existing = output[tag];
      if (existing) {
        existing.posts.push(note.id);
      } else {
        output[tag] = { posts: [note.id] };
      }
    }
  }

  return json(output);
};
