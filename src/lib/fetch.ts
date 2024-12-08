import { error } from '@sveltejs/kit';

export async function loadFetchJson<T>(
  fetchFn: typeof fetch,
  url: string,
  options?: RequestInit
): Promise<T> {
  let result = await fetchFn(url, options);
  if (!result.ok) {
    if (result.status === 404) {
      error(404, `Not found: ${url}`);
    }

    let body = await result.text();
    error(result.status, body);
  }

  return result.json();
}
