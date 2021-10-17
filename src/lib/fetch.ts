export type LoadFetchJsonResult<T = unknown> =
  | { status: number; error: string }
  | { data: T };

export async function loadFetchJson<T>(
  fetchFn: typeof fetch,
  url: string,
  options?: RequestInit
): Promise<LoadFetchJsonResult<T>> {
  let result = await fetchFn(url, options);
  if (!result.ok) {
    if (result.status === 404) {
      return {
        status: 404,
        error: `Not found: ${url}`,
      };
    }

    let body = await result.text();
    return {
      status: result.status,
      error: body,
    };
  }

  let data = await result.json();
  return {
    data,
  };
}
