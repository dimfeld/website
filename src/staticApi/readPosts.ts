import { promises as fs } from 'fs';
import * as path from 'path';
import pkgDir from 'pkg-dir';
import { Dictionary } from 'lodash';
import frontMatter from 'front-matter';
import globMod from 'glob';
import { promisify } from 'util';
import uniq from 'lodash/uniq';

export interface Post {
  id: string;
  format: 'md' | 'svx';
  type: 'post' | 'note';
  title: string;
  tags: string[];
  date: string;
  updated?: string;
  summary?: string;
  frontPageSummary?: string;
  content: string;
  status?: string;
  status_code?: string;
}

export async function readPost(
  basePath: string,
  filePath: string
): Promise<Post | null> {
  try {
    var data = await fs.readFile(filePath);
  } catch (e) {
    return null;
  }

  let { attributes, body } = frontMatter(data.toString());

  let id = filePath.slice(basePath.length + 1);
  let ext = path.extname(id);

  let metadataTags = (attributes.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  let pathTags = id.split('/').slice(0, -1);

  let content = body.trim().replace(/([^-\n])--([^-])/g, '$1—$2');
  return {
    ...attributes,
    id: id.slice(0, -ext.length),
    content,
    tags: uniq([...metadataTags, ...pathTags]),
  } as Post;
}

const glob = promisify(globMod);

const baseDir = pkgDir.sync(__dirname) || process.cwd();
export const postsDir = path.join(baseDir, 'posts');
export const notesDir = path.join(baseDir, 'notes');
export const svelteGlob = path.join(baseDir, 'src/routes/writing/*.svx');

export async function readMdFiles(
  basePath: string,
  type: 'post' | 'note'
): Promise<Post[]> {
  let filenames = await glob(basePath + '/**/*.md');
  let mdFiles = await Promise.all(filenames.map((f) => readPost(basePath, f)));
  return mdFiles.filter(Boolean).map((file: Post) => {
    return { ...file, type, format: 'md' };
  });
}

// export async function readSvelteFiles() {
//   let filenames = await glob(svelteGlob);
//   return Promise.all(
//     filenames.map(async (f) => {
//       let data = await fs.readFile(f);
//       let { attributes } = frontMatter(data.toString());
//       let id = path.basename(f).slice(0, -4);
//       return {
//         id,
//         format: 'svx',
//         ...attributes,
//       };
//     })
//   );
// }
