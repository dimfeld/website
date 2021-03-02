import { NowRequest, NowResponse } from '@vercel/node';
import fs from 'fs';
import { create_card } from '@dimfeld/create-social-card-wasm';

const postTitles = require('../post-titles.json');
const prod = process.env.NODE_ENV === 'production';

const bgImage = Uint8Array.from(fs.readFileSync('./api/card-bg.png'));
const inconsolataMedium = Uint8Array.from(
  fs.readFileSync('./api/Inconsolata-Medium.ttf')
);
const inconsolataSemiBold = Uint8Array.from(
  fs.readFileSync('./api/Inconsolata-SemiBold.ttf')
);

export default async function (request: NowRequest, response: NowResponse) {
  try {
    if (prod) {
      response.setHeader('Cache-Control', 'max-age=300, s-maxage=2592000');
    }

    let postTitle = postTitles[request.query.slug as string];
    if (!postTitle) {
      response.status(404).send('Not found');
      return;
    }

    let config = {
      fonts: {
        normal: inconsolataMedium,
        bold: inconsolataSemiBold,
      },
      background: bgImage,
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
            { font: 'normal', text: 'let post = Post {\n' },
            { font: 'normal', text: '  title: ' },
            { font: 'bold', text: `"${postTitle.title}"`, color: '99c794' },
            { font: 'normal', text: ',\n' },
            { font: 'normal', text: '  author: ' },
            { font: 'bold', text: `"Daniel Imfeld"`, color: '99c794' },
            { font: 'normal', text: ',\n' },
            { font: 'normal', text: '  date: ' },
            { font: 'bold', text: `"${postTitle.date}"`, color: '99c794' },
            {
              font: 'normal',
              text: '\n};\n\nbuildPost(post)\n  .and_then(renderContent)',
            },
          ],
        },
      ],
    };

    let imageData = create_card(config);
    let result = Buffer.from(imageData);

    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Content-Length', result.length);
    response.send(result);
  } catch (e) {
    console.error(e);
    response.status(500).json({ error: e.message });
  }
}
