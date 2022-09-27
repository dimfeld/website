import { journalSources, readAllSources } from '$lib/readPosts';
import type { LayoutServerLoad } from './$types';

export interface YearlyCounts {
  [year: string]: {
    [month: string]: number;
  };
}

export const load: LayoutServerLoad = async () => {
  const posts = readAllSources(journalSources);

  const counts = posts.reduce((acc: YearlyCounts, post) => {
    let [year, month] = post.date.split('-');

    let yearCounts = (acc[year] = acc[year] ?? {});
    yearCounts[month] = (yearCounts[month] || 0) + 1;
    return acc;
  }, {});

  return {
    counts,
  };
};
