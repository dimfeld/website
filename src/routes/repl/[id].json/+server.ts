import { json } from '@sveltejs/kit';
import { RequestHandler } from '@sveltejs/kit';
const prod = process.env.NODE_ENV === 'production';

export const GET: RequestHandler = async function GET({ params }) {
  let headers: Record<string, string> = {};
  let result = await fetch(`https://svelte.dev/repl/${params.id}.json`);
  if (result.ok) {
    if (prod) {
      headers['Cache-Control'] = 'max-age=300, s-maxage=2592000';
    }

    let data = await result.json();

    return json(data, { headers });
  } else {
    let message = await result.text();
    try {
      message = JSON.parse(message);
    } catch (e) {}

    return json(message, { status: result.status });
  }
};
