import { orderBy, Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import * as path from 'path';
import globMod from 'glob';
import { promisify } from 'util';
import { contentDir, readPost, Post } from './_readPost';

const glob = promisify(globMod);

const contentGlob = path.join(contentDir, '*.md');

export async function get(req, res: ServerResponse, next) {
  let fileNames = await glob(contentGlob);
  let files = await Promise.all(fileNames.map(readPost));
  let output = files.filter(Boolean).map((file) => {
    let { content, ...rest } = file;
    return rest;
  });

  output = orderBy(output, 'date', 'desc');

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
}
