import { orderBy, Dictionary } from 'lodash';
import { ServerResponse } from 'http';
import { getAll } from './_readPost';

export async function get(req, res: ServerResponse, next) {
  try {
    let posts = await getAll();
    let output = orderBy(posts, 'date', 'desc').map((post) => {
      let { content, ...rest } = post;
      return rest;
    });

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(output));
  } catch (e) {
    next(e);
  }
}
