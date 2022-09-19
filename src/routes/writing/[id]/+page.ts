import type { PageLoad } from '@sveltejs/kit';
import { loadFetchJson } from '$lib/fetch';

export const prerender = true;
export const load: PageLoad = async function load({ fetch, params }) {
  return await loadFetchJson(fetch, `/writing/${params.id}.json`);
};
