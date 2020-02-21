import { promises as fs } from 'fs';
import * as path from 'path';
import pkgDir from 'pkg-dir';
import { Dictionary } from 'lodash';
import frontMatter from 'front-matter';

export interface Post {
  id: string;
  title: string;
  tags: string;
  date: string;
  summary: string;
  content: string;
}

export const contentDir = path.join(
  pkgDir.sync(__dirname) || process.cwd(),
  'posts'
);

export async function readPost(filePath: string): Promise<Post | null> {
  try {
    var data = await fs.readFile(filePath);
  } catch (e) {
    return null;
  }

  let { attributes, body } = frontMatter(data.toString());
  let id = path.basename(filePath);
  let ext = path.extname(id);
  return {
    id: id.slice(0, -ext.length),
    content: body.trim(),
    ...attributes,
  } as Post;
}
