import { journalSources, readAllSources } from '$lib/readPosts';
import sorter from 'sorters';

export async function load() {
  let journals = await readAllSources(journalSources);
  let sortedJournals = journals.sort(
    sorter({ value: (p) => p.date, descending: true })
  );

  return {
    journals: sortedJournals.slice(0, 30),
  };
}
