import { RequestHandler } from '@sveltejs/kit';
import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
} from '$lib/readPosts.js';
import { maxBy } from 'lodash-es';

export const get: RequestHandler = async function get() {
  let posts = await readAllSources(postSources);
  let notes = await readAllSources(noteSources);

  let latestPost = maxBy(posts, (post) => post.date);
  let latestNote = maxBy(notes, (note) => note.updated || note.date);
  let lastCreatedNote = maxBy(notes, 'date');

  return {
    body: {
      post: latestPost ? stripContent(latestPost) : null,
      note: latestNote ? stripContent(latestNote) : null,
      lastCreatedNote: lastCreatedNote ? stripContent(lastCreatedNote) : null,
    } as any,
  };
};
