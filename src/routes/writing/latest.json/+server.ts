import { json, RequestHandler } from '@sveltejs/kit';
import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
} from '$lib/readPosts';
import { maxBy } from 'lodash-es';

export const GET: RequestHandler = async function GET() {
  let posts = await readAllSources(postSources);
  let notes = await readAllSources(noteSources);

  let latestPost = maxBy(posts, (post) => post.date);
  let latestNote = maxBy(notes, (note) => note.updated || note.date);
  let lastCreatedNote = maxBy(notes, 'date');

  return json({
    post: latestPost ? stripContent(latestPost) : null,
    note: latestNote ? stripContent(latestNote) : null,
    lastCreatedNote: lastCreatedNote ? stripContent(lastCreatedNote) : null,
  });
};
