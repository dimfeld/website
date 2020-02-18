import { promises as fs } from 'fs';
import { Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import * as path from 'path';
import { contentDir, readPost } from './_readPost';

export async function get(req, res: ServerResponse, next) {
  let { id } = req.params;
  id = id.replace(/[\./]/g, '');

  let filePath = path.join(contentDir, id + '.md');
  let data = await readPost(filePath);
  if (!data) {
    return res.writeHead(404).end();
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
