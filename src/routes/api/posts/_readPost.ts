import { promises as fs } from 'fs';
import * as path from 'path';
import pkgDir from 'pkg-dir';
import { Dictionary } from 'lodash';
import frontMatter from 'front-matter';
import globMod from 'glob';
import { promisify } from 'util';
import markdownIt from 'markdown-it';
import * as highlight from 'highlight.js';
import * as footnote from 'markdown-it-footnote';
import * as abbr from 'markdown-it-abbr';
import * as toc from 'markdown-it-toc-done-right';
import * as anchor from 'markdown-it-anchor';

export const renderer = markdownIt({
  linkify: true,
  highlight: function(str, lang) {
    if (lang && highlight.getLanguage(lang)) {
      try {
        return highlight.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  },
})
  .use(footnote)
  .use(abbr)
  .use(toc)
  .use(anchor, {
    permalink: true,
    permalinkSymbol: '§',
  });

export interface Post {
  id: string;
  format: 'md' | 'svx';
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

const glob = promisify(globMod);

const contentGlob = path.join(contentDir, '*.md');
const svelteGlob = path.join(
  pkgDir.sync(__dirname) || process.cwd(),
  'src/routes/writing/*.svx'
);

async function readMdFiles() {
  let filenames = await glob(contentGlob);
  let mdFiles = await Promise.all(filenames.map(readPost));
  return mdFiles.filter(Boolean).map((file) => {
    return { ...file, format: 'md' };
  });
}

async function readSvelteFiles() {
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

export async function getAll(): Promise<Post[]> {
  let [mdPosts, sveltePosts] = await Promise.all([
    readMdFiles(),
    readSvelteFiles(),
  ]);

  return [...mdPosts, ...sveltePosts];
}
