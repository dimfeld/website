import { orderBy, Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import * as path from 'path';
import globMod from 'glob';
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
  let filenames = (await glob(svelteGlob)).filter((f) => {
    let base = path.basename(f);
    return base !== '[id].svelte' && base !== 'index.svelte';
  });
  let components = await Promise.all(filenames.map((f) => import(f)));
  return components.map((c) => c.metadata);
}

export async function get(req, res: ServerResponse, next) {
  let [mdPosts, sveltePosts] = await Promise.all([
    readMdFiles(),
    readSvelteFiles(),
  ]);

  let output = orderBy([...mdPosts, ...sveltePosts], 'date', 'desc');

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
}
