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
  const dateSorter = sorter({ value: 'date', descending: true });
  let posts = readAllSources(postSources).sort(dateSorter);
  let notes = readAllSources(noteSources).sort(dateSorter);
  let journals = readAllSources(journalSources);

  let latestPosts = posts.slice(0, 3);
  let latestNotes = notes
    .sort(sorter({ value: (p) => p.updated || p.date, descending: true }))
    .slice(0, 3);
  let lastCreatedNote = maxBy(notes, 'date');

  let sortedJournals = journals.sort(dateSorter);

  const NUM_JOURNALS = 3;
  return {
    latestPosts: latestPosts.map(stripContent),
    latestNotes: latestNotes.map(stripContent),
    latestJournals: sortedJournals.slice(0, NUM_JOURNALS),
    nextJournal: sortedJournals[NUM_JOURNALS]?.id,
    lastCreatedNote: stripContent(lastCreatedNote),
  };
}
