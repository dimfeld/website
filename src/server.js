import sirv from 'sirv';
import polka from 'polka';
import compression from 'compression';
import * as sapper from '@sapper/server';
import {
  allPosts,
  getPost,
  allNotes,
  getNote,
  noteTags,
  getTag,
  initPostCache,
} from './staticApi/posts';

import './tailwind.css';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

async function run() {
  await initPostCache();

  polka() // You can also use Express
    .use(
      compression({ threshold: 0 }),
      sirv('static', { dev }),
      sapper.middleware({
        ignore: '/api',
      })
    )
    .get('/api/posts', allPosts)
    .get('/api/posts/:id', getPost)
    .get('/api/notes/*', getNote)
    .get('/api/notes', allNotes)
    .get('/api/tags', noteTags)
    .get('/api/tags/:id', getTag)
    .listen(PORT, (err) => {
      if (err) console.log('error', err);
    });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
