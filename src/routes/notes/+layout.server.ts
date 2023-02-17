import { stripContent, readAllSources, noteSources } from '$lib/readPosts';
import { createTagsLookup, formatTag } from '$lib/tags';
import sorter from 'sorters';

export async function load() {
  let noteResponse = readAllSources(noteSources);

  let notes = noteResponse
    .sort(
      sorter(
        { value: (p) => p.updated || p.date, descending: true },
        { value: (p) => p.title }
      )
    )
    .map(stripContent);

  return { notes, tags: createTagsLookup(noteResponse) };
}
