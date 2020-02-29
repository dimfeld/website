import markdownIt from 'markdown-it';
import * as highlight from 'highlight.js';
import * as footnote from 'markdown-it-footnote';
import * as abbr from 'markdown-it-abbr';
import * as toc from 'markdown-it-toc-done-right';
import * as anchor from 'markdown-it-anchor';

export default function renderer() {
  let r = markdownIt({
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
    .use(anchor);

  r.renderer.rules.footnote_ref = function render_footnote_ref(
    tokens,
    idx,
    options,
    env,
    slf
  ) {
    var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
    var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
    var refid = id;

    if (tokens[idx].meta.subId > 0) {
      refid += ':' + tokens[idx].meta.subId;
    }

    return (
      `<sup class="footnote-ref"><a href="${env.url}#fn` +
      id +
      '" id="fnref' +
      refid +
      '">' +
      caption +
      '</a></sup>'
    );
  };

  r.renderer.rules.footnote_anchor = function render_footnote_anchor(
    tokens,
    idx,
    options,
    env,
    slf
  ) {
    var id = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);

    if (tokens[idx].meta.subId > 0) {
      id += ':' + tokens[idx].meta.subId;
    }

    /* ↩ with escape code to prevent display as Apple Emoji on iOS */
    return `<a href="${env.url}#fnref${id}" class="footnote-backref">\u21a9\uFE0E</a>`;
  };

  let defaultNormalize = r.normalizeLink;

  return (content: string, env: { [key: string]: string }) => {
    let { url: base, host } = env;

    let lastSlash = base.lastIndexOf('/');
    base = base.slice(0, lastSlash + 1);

    // Convert links to absolute for RSS.
    r.normalizeLink = (url) => {
      if (!url.includes('//')) {
        if (!url.startsWith('/')) {
          url = `${base}${url}`;
        }

        if (host) {
          url = `${host}${url}`;
        }
      }
      return defaultNormalize(url);
    };

    return r.render(content, env);
  };
}
