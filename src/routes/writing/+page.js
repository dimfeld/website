import { loadFetchJson } from '$lib/fetch';
export const prerender = true;
export async function load({ fetch }) {
  return await loadFetchJson(fetch, '/writing/list.json');
}
