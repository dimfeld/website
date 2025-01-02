import { error, type RequestHandler } from '@sveltejs/kit';
import { generateImage } from '$lib/og-image/generate';
import { lookupContent, noteSources } from '$lib/readPosts';

export const GET: RequestHandler = async function GET({ fetch, params }) {
  let { id } = params;
  let note = await lookupContent(noteSources, id);
  if (!note) {
    error(404, 'not found');
  }

  let { body, headers } = await generateImage(fetch, note);
  return new Response(body, { headers });
};
