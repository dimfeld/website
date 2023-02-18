import capitalize from 'just-capitalize';
import type { PostInfo } from './readPosts';

export function formatTag(tag: string) {
  return tag
    .split(' ')
    .map((word) => {
      if (word !== word.toUpperCase()) {
        word = capitalize(word);
      }
      return word;
    })
    .join(' ');
}

export function createTagsLookup(posts: PostInfo[]) {
  let tags: Record<string, { posts: string[] }> = {};
  for (let post of posts) {
    for (let tag of post.tags) {
      tag = formatTag(tag).replace(/[^a-zA-Z0-9]/g, '-');
      let existing = tags[tag];
      if (existing) {
        existing.posts.push(post.id);
      } else {
        tags[tag] = { posts: [post.id] };
      }
    }
  }

  return tags;
}
