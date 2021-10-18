import { RequestHandler } from '@sveltejs/kit';
const prod = process.env.NODE_ENV === 'production';

export const get: RequestHandler = async function get({ params }) {
  let headers: Record<string, string> = {};
  let result = await fetch(`https://svelte.dev/repl/${params.id}.json`);
  if (result.ok) {
    if (prod) {
      headers['Cache-Control'] = 'max-age=300, s-maxage=2592000';
    }

    let data = await result.json();

    return {
      body: data,
      headers,
    };
  } else {
    let message = await result.text();
    try {
      message = JSON.parse(message);
    } catch (e) {}

    return {
      status: result.status,
      body: message,
    };
  }
};
