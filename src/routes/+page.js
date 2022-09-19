import { loadFetchJson } from '$lib/fetch';
export const prerender = true;
export async function load({ fetch }) {
  let r = await loadFetchJson(fetch, '/writing/latest.json');

  let { post, note, lastCreatedNote } = r;
  return { latestPost: post, latestNote: note, lastCreatedNote };
}
