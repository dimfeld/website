import { initPostCache, postCache } from './src/staticApi/posts';
import { Post } from './src/staticApi/readPosts';
import * as fs from 'fs';

function postMeta(p: Post) {
  return {
    title: p.title,
    date: p.updated ?? p.date,
  };
}

async function main() {
  await initPostCache();

  let output: Record<string, ReturnType<typeof postMeta>> = {};
  for (let post of postCache.postList) {
    output['post_' + post.id] = postMeta(post);
  }

  for (let note of postCache.noteList) {
    output['note_' + note.id] = postMeta(note);
  }

  fs.writeFileSync('api/post-titles.json', JSON.stringify(output));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
