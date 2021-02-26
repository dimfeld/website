import { NowRequest, NowResponse } from '@vercel/node';
import fs from 'fs';
import { create_card } from '@dimfeld/create-social-card-wasm';

const postTitles = require('../post-titles.json');
const prod = process.env.NODE_ENV === 'production';

const bgImage = Uint8Array.from(fs.readFileSync('./api/card-bg.png'));
const fontData = Uint8Array.from(fs.readFileSync('./api/Inter.ttf'));

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
      text: postTitle.title,
      min_size: 8,
      max_size: 200,
      color: 'D03030',
      text_rect: {
        top: 25,
        bottom: 250,
        left: 225,
        right: 575,
      },
      shadow: {
        x: 2,
        y: 2,
        blur: 2,
      },
    };

    let imageData = create_card(bgImage, fontData, config);
    let result = Buffer.from(imageData);

    response.setHeader('Content-Type', 'image/png');
    response.setHeader('Content-Length', result.length);
    response.send(result);
  } catch (e) {
    console.error(e);
    response.status(500).json({ error: e.message });
  }
}
