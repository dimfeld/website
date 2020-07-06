import got from 'got';
import { ServerResponse } from 'http';

const port = process.env.PORT;

// A shim to make sapper export work properly while still letting
// me use a real server.
export async function get(req, res: ServerResponse) {
  let { path } = req.params;
  try {
    let result = await got.get(
      `http://localhost:${port}/static-api/${path.join('/')}`,
      {
        throwHttpErrors: false,
        decompress: false,
      }
    );

    res.writeHead(result.statusCode, result.headers).end(result.body);
  } catch (e) {
    res.writeHead(500).end(e.message);
  }
}
