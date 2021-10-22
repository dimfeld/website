import { dev } from '$app/env';

export async function handle({ request, resolve }) {
  const response = await resolve(request);

  if (dev) {
    return response;
  }

  return {
    ...response,
    headers: {
      ...response.headers,
      // Tell Vercel to cache everything forever.
      // Vercel's CDN will clear everything on redeploy so we don't have to worry about invalidation.
      'Cache-Control': 'max-age=300, s-maxage=2592000',
    },
  };
}
