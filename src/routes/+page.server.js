import {
  stripContent,
  readAllSources,
  postSources,
  noteSources,
  journalSources,
} from '$lib/readPosts';
import { maxBy } from 'lodash-es';
import sorter from 'sorters';

export async function load() {
  let posts = await readAllSources(postSources);
  let notes = await readAllSources(noteSources);
  let journals = await readAllSources(journalSources);

  let latestPost = maxBy(posts, (post) => post.date);
  let latestNote = maxBy(notes, (note) => note.updated || note.date);
  let lastCreatedNote = maxBy(notes, 'date');

  return {
    latestPost: stripContent(latestPost),
    latestNote: stripContent(latestNote),
    latestJournals: journals
      .sort(sorter({ value: (p) => p.title, descending: true }))
      .slice(0, 3),
    lastCreatedNote: stripContent(lastCreatedNote),
  };
}
