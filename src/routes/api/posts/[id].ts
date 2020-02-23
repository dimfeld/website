import { ServerResponse } from 'http';
import * as path from 'path';
import { renderer, contentDir, readPost } from './_readPost';

export async function get(req, res: ServerResponse, next) {
  try {
    let { id } = req.params;
    id = id.replace(/[\./]/g, '');

    let filePath = path.join(contentDir, id + '.md');
    let data = await readPost(filePath);

    if (!data) {
      return res.writeHead(404).end();
    }

    data.content = renderer.render(data.content);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (e) {
    next(e);
  }
}
