import { RequestHandler } from '@sveltejs/kit';
import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
} from '$lib/readPosts.js';
import sorter from 'sorters';
import { maxBy } from 'lodash-es';

/**
 * @type {import('@sveltejs/kit').RequestHandler}
 */
export async function get() {
  let posts = await readAllSources(postSources);
  let notes = await readAllSources(noteSources);

  let latestPost = posts.sort(
    sorter({ field: (p) => p.date, descending: true })
  );
  let latestNote = notes.sort(
    sorter({ field: (n) => n.updated || n.date, descending: true })
  );
  let lastCreatedNote = maxBy(notes, 'date');

  return {
    body: {
      post: stripContent(latestPost),
      note: stripContent(latestNote),
      lastCreatedNote: stripContent(lastCreatedNote),
    },
  };
}
