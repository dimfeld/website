import { ServerResponse } from 'http';
import * as path from 'path';
import { contentDir, readPost } from './_readPost';
import renderFactory from '../../../markdown';

const renderer = renderFactory();

export async function get(req, res: ServerResponse, next) {
  try {
    let { id } = req.params;
    id = id.replace(/[\./]/g, '');

    let filePath = path.join(contentDir, id + '.md');
    let data = await readPost(filePath);

    if (!data) {
      return res.writeHead(404).end();
    }

    data.content = renderer.render(data.content, { base: `/writing/${id}` });
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));
  } catch (e) {
    next(e);
  }
}
