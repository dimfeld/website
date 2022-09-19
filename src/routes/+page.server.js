import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
} from '$lib/readPosts';
import { maxBy } from 'lodash-es';

export async function load() {
  let posts = await readAllSources(postSources);
  let notes = await readAllSources(noteSources);

  let latestPost = maxBy(posts, (post) => post.date);
  let latestNote = maxBy(notes, (note) => note.updated || note.date);
  let lastCreatedNote = maxBy(notes, 'date');

  return {
    latestPost: latestPost ? stripContent(latestPost) : null,
    latestNote: latestNote ? stripContent(latestNote) : null,
    lastCreatedNote: lastCreatedNote ? stripContent(lastCreatedNote) : null,
  };
}
