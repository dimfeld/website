import * as path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { create_card } from '@dimfeld/create-social-card-wasm';
import type { Post } from '../readPosts';

const prod = process.env.NODE_ENV === 'production';

// Work in Vercel serverless function or in Vite.
const dirname = process.env.VERCEL
  ? process.cwd()
  : path.dirname(fileURLToPath(import.meta.url));

async function read(filename: string) {
  let fullPath = path.join(dirname, filename);
  let buffer = await fs.readFile(fullPath);
  return Uint8Array.from(buffer);
}

const bgImage = 'card-bg.png';
const inconsolataMedium = 'Inconsolata-Medium.ttf';
const inconsolataSemiBold = 'Inconsolata-SemiBold.ttf';

export async function generateImage(post: Post) {
  let { title, date, updated, type } = post;
  let objType = type === 'note' ? 'Note' : 'Post';

  let cardDate = new Date(updated || date).toUTCString().slice(0, -13);

  let [normal, bold, background] = await Promise.all([
    read(inconsolataMedium),
    read(inconsolataSemiBold),
    read(bgImage),
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
