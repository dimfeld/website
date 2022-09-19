import { RequestHandler } from '@sveltejs/kit';
import { generateImage } from '../../lib/og-image/generate';
import { lookupContent, noteSources } from '../../lib/readPosts';

export const GET: RequestHandler = async function GET({ params }) {
  let { id } = params;
  let note = await lookupContent(noteSources, id);
  if (!note) {
    return {
      status: 404,
    };
  }

  return generateImage(note);
};
