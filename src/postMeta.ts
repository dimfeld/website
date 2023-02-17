import type { PostInfo } from '$lib/readPosts';

export const statuses = [
  {
    id: 'speculative',
    short: 'Speculative',
    long: 'Early ',
  },
  {
    id: 'medium',
    short: 'Medium',
    long: 'Medium',
  },
  {
    id: 'finished',
    short: 'Finished',
    long: 'I believe everything here to be correct',
  },
];

export function cardImageUrl(post: PostInfo, absolute: boolean) {
  let imageUrl = post.cardImage;
  if (!imageUrl) {
    return;
  }

  if (!imageUrl.startsWith('http')) {
    imageUrl = '/images/' + imageUrl;
    if (absolute) {
      imageUrl = process.env.SITE_DOMAIN + imageUrl;
    }
  }

  return imageUrl;
}
