import { error } from '@sveltejs/kit';

export async function loadFetchJson<T>(
  fetchFn: typeof fetch,
  url: string,
  options?: RequestInit
): Promise<T> {
  let result = await fetchFn(url, options);
  if (!result.ok) {
    if (result.status === 404) {
      throw error(404, `Not found: ${url}`);
    }

    let body = await result.text();
    throw error(result.status, body);
  }

  return result.json();
}
