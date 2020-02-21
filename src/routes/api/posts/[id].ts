import { ServerResponse } from 'http';
import * as path from 'path';
import { contentDir, readPost } from './_readPost';
import markdownIt from 'markdown-it';
import * as highlight from 'highlight.js';
import * as footnote from 'markdown-it-footnote';
import * as abbr from 'markdown-it-abbr';
import * as toc from 'markdown-it-toc-done-right';
import * as anchor from 'markdown-it-anchor';

const renderer = markdownIt({
  linkify: true,
  highlight: function(str, lang) {
    if (lang && highlight.getLanguage(lang)) {
      try {
        return highlight.highlight(lang, str).value;
      } catch (__) {}
    }

    return ''; // use external default escaping
  },
})
  .use(footnote)
  .use(abbr)
  .use(toc)
  .use(anchor, {
    permalink: true,
    permalinkSymbol: '§',
  });

export async function get(req, res: ServerResponse, next) {
  let { id } = req.params;
  id = id.replace(/[\./]/g, '');

  let filePath = path.join(contentDir, id + '.md');
  let data = await readPost(filePath);

  if (!data) {
    return res.writeHead(404).end();
  }

  data.content = renderer.render(data.content);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}
