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
  let posts = readAllSources(postSources);
  let notes = readAllSources(noteSources);
  let journals = readAllSources(journalSources);

  let latestPost = maxBy(posts, (post) => post.date);
  let latestNote = maxBy(notes, (note) => note.updated || note.date);
  let lastCreatedNote = maxBy(notes, 'date');

  let sortedJournals = journals.sort(
    sorter({ value: (p) => p.date, descending: true })
  );

  const NUM_JOURNALS = 3;
  return {
    latestPost: stripContent(latestPost),
    latestNote: stripContent(latestNote),
    latestJournals: sortedJournals.slice(0, NUM_JOURNALS),
    nextJournal: sortedJournals[NUM_JOURNALS]?.id,
    lastCreatedNote: stripContent(lastCreatedNote),
  };
}