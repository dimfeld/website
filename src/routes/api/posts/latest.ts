import { orderBy, Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import { getAll } from './_readPost';

export async function get(req, res: ServerResponse, next) {
  try {
    let posts = await getAll();
    let output = orderBy(posts, 'date', 'desc');

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(output[0]));
  } catch (e) {
    next(e);
  }
}
