import { error, RequestHandler } from '@sveltejs/kit';
import { generateImage } from '../../../lib/og-image/generate';
import { lookupContent, noteSources } from '../../../lib/readPosts';

export const GET: RequestHandler = async function GET({ params }) {
  let { id } = params;
  let note = await lookupContent(noteSources, id);
  if (!note) {
    throw error(404, 'not found');
  }

  let { body, headers } = await generateImage(note);
  return new Response(body, { headers });
};
