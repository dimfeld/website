import { Dictionary } from 'lodash';
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
  let output = files.reduce((acc: Dictionary<Post>, file) => {
    if (file) {
      acc[file.id] = file;
    }
    return acc;
  }, {});

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(output));
}
