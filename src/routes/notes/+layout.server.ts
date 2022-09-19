import { stripContent, readAllSources, noteSources } from '$lib/readPosts';
import { formatTag } from '$lib/tags';
import sorter from 'sorters';

export async function load() {
  let noteResponse = await readAllSources(noteSources);

  let tags: Record<string, { posts: string[] }> = {};
  for (let note of noteResponse) {
    for (let tag of note.tags) {
      tag = formatTag(tag).replace(/[^a-zA-Z0-9]/g, '-');
      let existing = tags[tag];
      if (existing) {
        existing.posts.push(note.id);
      } else {
        tags[tag] = { posts: [note.id] };
      }
    }
  }

  let notes = noteResponse
    .sort(
      sorter(
        { value: (p) => p.updated || p.date, descending: true },
        { value: (p) => p.title }
      )
    )
    .map(stripContent);

  return { notes, tags };
}
