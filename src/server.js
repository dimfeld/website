import 'source-map-support';
import path from 'path';
import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import {
  allPosts,
  getPost,
  latestPost,
  allNotes,
  getNote,
  noteTags,
  getTag,
  initPostCache,
} from './staticApi/posts';

import { config } from 'dotenv';
config();

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

async function run() {
  await initPostCache();

  polka() // You can also use Express
    .use(compression({ threshold: process.env.SAPPER_EXPORT ? 1000000 : 0 }))
    .use(sirv('static', { dev }))

    .use(
      sapper.middleware({
        ignore: /^\/(?:static-api|images)\//,
      })
    )

    .get('/static-api/latest', latestPost)
    .get('/static-api/allPosts', allPosts)
    .get('/static-api/posts/:id', getPost)
    .get('/static-api/notes/*', getNote)
    .get('/static-api/allNotes', allNotes)
    .get('/static-api/allTags', noteTags)
    .get('/static-api/tags/:id', getTag)
    .listen(PORT, (err) => {
      if (err) console.log('error', err);
    });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
