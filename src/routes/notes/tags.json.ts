import { RequestHandler } from '@sveltejs/kit';
import { noteSources, lookupContent, readAllSources } from '$lib/readPosts';
import  capitalize  from 'just-capitalize';

export const get: RequestHandler = async function get({ params: { id } }) {
  let notes = await readAllSources(noteSources);

  let output: Record<string, { posts: string[] }> = {};
  for (let note of notes) {
    for (let tag of note.tags) {
      tag = tag.split(' ').map((word) => {
        if(word !== word.toUpperCase()) {
          word = capitalize(word);
        }

        return word.replace(/[^a-zA-Z0-9]/g, '-');
      }).join(' ');
      let existing = output[tag];
      if (existing) {
        existing.posts.push(note.id);
      } else {
        output[tag] = { posts: [note.id] };
      }
    }
  }

  return {
    body: output,
  };
};
