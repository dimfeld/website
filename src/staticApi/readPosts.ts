import { promises as fs } from 'fs';
import * as path from 'path';
import pkgDir from 'pkg-dir';
import { Dictionary } from 'lodash';
import frontMatter from 'front-matter';
import globMod from 'glob';
import { promisify } from 'util';

export interface Post {
  id: string;
  format: 'md' | 'svx';
  type: 'post' | 'note';
  title: string;
  tags?: string[];
  date: string;
  summary: string;
  content: string;
  status?: string;
  status_code?: string;
}

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
    ...attributes,
    id: id.slice(0, -ext.length),
    content: body.trim(),
    tags: (attributes.tags || '').split(',').map((t) => t.trim()),
  } as Post;
}

const glob = promisify(globMod);

const baseDir = pkgDir.sync(__dirname) || process.cwd();
export const postsGlob = path.join(baseDir, '*.md');
export const notesGlob = path.join(baseDir, '**/*.md');
export const svelteGlob = path.join(baseDir, 'src/routes/writing/*.svx');

export async function readMdFiles(
  contentGlob: string,
  type: 'post' | 'note'
): Promise<Post[]> {
  let filenames = await glob(contentGlob);
  let mdFiles = await Promise.all(filenames.map(readPost));
  return mdFiles.filter(Boolean).map((file: Post) => {
    return { ...file, type, format: 'md' };
  });
}

export async function readSvelteFiles() {
  let filenames = await glob(svelteGlob);
  return Promise.all(
    filenames.map(async (f) => {
      let data = await fs.readFile(f);
      let { attributes } = frontMatter(data.toString());
      let id = path.basename(f).slice(0, -4);
      return {
        id,
        format: 'svx',
        ...attributes,
      };
    })
  );
}
