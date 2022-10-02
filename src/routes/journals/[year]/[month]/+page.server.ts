import { journalSources, readAllSources } from '$lib/readPosts';
import sorter from 'sorters';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  let { year, month } = params;

  let datePrefix = `${year}-${month}-`;
  let posts = readAllSources(journalSources)
    .filter((p) => p.date.startsWith(datePrefix))
    .sort(sorter({ value: 'date', descending: true }));

  return {
    posts,
  };
};
