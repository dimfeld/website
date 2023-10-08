import { dev } from '$app/environment';

export const config = {
  runtime: 'edge',
};

export function GET({ fetch }) {
  if (dev) {
    return new Response('', {
      headers: {
        'content-type': 'application/javascript',
      },
    });
  }

  return fetch('https://plausible.io/js/script.js');
}
