import { RequestHandler } from '@sveltejs/kit';
import { generateImage } from '../../lib/og-image/generate';
import { lookupContent, postSources } from '../../lib/readPosts';

export const GET: RequestHandler = async function GET({ params }) {
  let { id } = params;
  let post = await lookupContent(postSources, id);
  if (!post) {
    return {
      status: 404,
    };
  }

  return generateImage(post);
};
