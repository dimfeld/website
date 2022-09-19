import { loadFetchJson } from '../../../lib/fetch';

export const prerender = true;
export async function load({ fetch, params: { path } }) {
  return await loadFetchJson(fetch, `/notes/note/${path}.json`);
}
