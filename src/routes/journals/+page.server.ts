import type { PageServerLoad } from './$types';
import { journalSources, readAllSources } from '$lib/readPosts';
import sorter from 'sorters';

export const load: PageServerLoad = () => {
  let journals = readAllSources(journalSources);
  let sortedJournals = journals.sort(
    sorter({ value: (p) => p.date, descending: true })
  );

  return {
    journals: sortedJournals.slice(0, 30),
  };
};
