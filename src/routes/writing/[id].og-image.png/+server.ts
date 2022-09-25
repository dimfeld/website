import { error } from '@sveltejs/kit';
import { RequestHandler } from '@sveltejs/kit';
import { generateImage } from '../../../lib/og-image/generate';
import { lookupContent, postSources } from '../../../lib/readPosts';

export const GET: RequestHandler = async function GET({ setHeaders, params }) {
  let { id } = params;
  let post = await lookupContent(postSources, id);
  if (!post) {
    throw error(404, 'Not found');
  }

  let { headers, body } = await generateImage(post);
  return new Response(body, { headers });
};
