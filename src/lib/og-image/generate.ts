import { create_card } from '@dimfeld/create-social-card-wasm';
import initWasm from '@dimfeld/create-social-card-wasm';
import wasmUrl from '@dimfeld/create-social-card-wasm/create_social_card_wasm_bg.wasm?url';
import type { Post } from '../readPosts';

import bgImage from  './card-bg.png?url';
import inconsolataMedium from './Inconsolata-Medium.ttf?url';
import inconsolataSemiBold from './Inconsolata-SemiBold.ttf?url';

const prod = process.env.NODE_ENV === 'production';

export async function generateImage(fetch: typeof window.fetch, post: Post) {
  const wasmFile = await fetch(wasmUrl);
  await initWasm(wasmFile);
  let { title, date, updated, type } = post;
  let objType = type === 'note' ? 'Note' : 'Post';

  let cardDate = new Date(updated || date).toUTCString().slice(0, -13);

  let [normal, bold, background] = await Promise.all([
    fetch(inconsolataMedium).then((r) => r.bytes()),
    fetch(inconsolataSemiBold).then((r) => r.bytes()),
    fetch(bgImage).then((r) => r.bytes()),
  ]);

  let config = {
    fonts: {
      normal,
      bold,
    },
    background,
    blocks: [
      {
        wrap: true,
        min_size: 8,
        max_size: 80,
        color: '62b3b2',
        h_align: 'left',
        v_align: 'center',
        rect: {
          top: 0,
          left: 0,
          right: 800,
          bottom: 418,
        },
        padding: {
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
        },
        text: [
          { font: 'normal', text: `let ${type} = ${objType} {` + '\n' },
          { font: 'normal', text: '  title: ' },
          { font: 'bold', text: `"${title}"`, color: '99c794' },
          { font: 'normal', text: ',\n' },
          { font: 'normal', text: '  author: ' },
          { font: 'bold', text: `"Daniel Imfeld"`, color: '99c794' },
          { font: 'normal', text: ',\n' },
          { font: 'normal', text: '  date: ' },
          { font: 'bold', text: `"${cardDate}"`, color: '99c794' },
          {
            font: 'normal',
            text:
              '\n};\n\nbuild_post(' + type + ')\n  .and_then(render_content)',
          },
        ],
      },
    ],
  };

  let imageData = create_card(config);
  let result = Buffer.from(imageData);

  let headers: Record<string, string> = {
    'Content-Type': 'image/png',
  };

  if (prod) {
    headers['Cache-Control'] = 'max-age=300, s-maxage=2592000';
  }

  return {
    headers,
    body: result,
  };
}
