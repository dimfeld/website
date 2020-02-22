import { orderBy, Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import { promises as fs } from 'fs';
import * as path from 'path';
import globMod from 'glob';
import frontMatter from 'front-matter';
import { promisify } from 'util';
import { contentDir, readPost, Post } from './_readPost';
import pkgDir from 'pkg-dir';

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
    let { content, ...rest } = file;
    return rest;
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
        ...attributes,
      };
    })
  );
}

export async function get(req, res: ServerResponse, next) {
  try {
    let [mdPosts, sveltePosts] = await Promise.all([
      readMdFiles(),
      readSvelteFiles(),
    ]);

    let output = orderBy([...mdPosts, ...sveltePosts], 'date', 'desc');

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(output));
  } catch (e) {
    next(e);
  }
}
