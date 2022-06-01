import { dev } from '$app/env';
import { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  if (dev) {
    return response;
  }

  // Tell Vercel to cache everything forever.
  // Vercel's CDN will clear everything on redeploy so we don't have to worry about invalidation.
  response.headers.set('Cache-Control', 'max-age=300, s-maxage=2592000');

  return response;
};
