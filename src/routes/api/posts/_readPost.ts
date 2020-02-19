import { promises as fs } from 'fs';
import * as path from 'path';
import pkgDir from 'pkg-dir';
import { Dictionary } from 'lodash';

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
    var data = (await fs.readFile(filePath)).toString();
  } catch (e) {
    return null;
  }

  let [headerText, content] = data.split('---', 2);

  let headers = headerText
    .split('\n')
    .reduce((acc: Dictionary<string>, headerLine) => {
      let [key, value] = headerLine.split(':', 2);
      key = key.trim().toLowerCase();
      if (key) {
        acc[key] = value.trim();
      }
      return acc;
    }, {});

  let id = path.basename(filePath);
  let ext = path.extname(id);
  return {
    id: id.slice(0, -ext.length),
    content: content.trim(),
    ...headers,
  } as Post;
}
