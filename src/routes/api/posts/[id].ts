import { ServerResponse } from 'http';
import * as path from 'path';
import { contentDir, readPost } from './_readPost';
import marked from 'marked';

export async function get(req, res: ServerResponse, next) {
  let { id } = req.params;
  id = id.replace(/[\./]/g, '');

  let filePath = path.join(contentDir, id + '.md');
  let data = await readPost(filePath);

  if (!data) {
    return res.writeHead(404).end();
  }

  data.content = marked(data.content);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
