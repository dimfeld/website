import { NowRequest, NowResponse } from '@vercel/node';
import got from 'got';

export default async function (request: NowRequest, response: NowResponse) {
  try {
    let data = await got(`https://svelte.dev/repl/${request.query.id}.json`);
    response.setHeader('Cache-Control', 'max-age=300, s-maxage=2592000');
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.send(data.body);
  } catch (e) {
    console.error(e);
    if (e instanceof got.HTTPError) {
      response.status(e.response.statusCode);
      let contentTypes = []
        .concat(e.response.headers['content-type'] || '')
        .flatMap((name) => name.split(';').map((s) => s.trim()));
      if (contentTypes.includes('application/json')) {
        response.setHeader('Content-Type', 'application/json');
        response.send(e.response.body);
      } else {
        response.json({
          error: e.response.body,
        });
      }
    } else {
      response.status(500).json({ error: e.message });
    }
  }
}
