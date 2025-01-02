import { error } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { generateImage } from '$lib/og-image/generate.js';
import { lookupContent, postSources } from '$lib/readPosts';

export const GET: RequestHandler = async function GET({ fetch, params }) {
  let { id } = params;
  let post = await lookupContent(postSources, id);
  if (!post) {
    error(404, 'Not found');
  }

  let { headers, body } = await generateImage(fetch, post);
  return new Response(body, { headers });
};
