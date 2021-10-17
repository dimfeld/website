import markdownIt from 'markdown-it';
import * as highlight from 'highlight.js';
import hljsSvelte from 'highlightjs-svelte';
import footnote from 'markdown-it-footnote';
import abbr from 'markdown-it-abbr';
import toc from 'markdown-it-toc-done-right';
import anchor from 'markdown-it-anchor';
import container from '@gerhobbelt/markdown-it-container';
import StateCore from 'markdown-it/lib/rules_core/state_core';

hljsSvelte(highlight);

export default function renderer() {
  let r = markdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight: function (str, lang) {
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
      permalinkSymbol: '🔗',
      permalinkHref: (slug: string, state: StateCore) =>
        `${state.env.host}${state.env.url}#${slug}`,
    })
    .use(container, 'side-by-side', {
      content: renderSideBySide,
    })
    .use(container, 'note', {
      render: function (tokens, idx) {
        let token = tokens[idx];
        if (token.nesting === 1) {
          return `<aside class="note">`;
        } else {
          return `</aside>`;
        }
      },
    });

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

  function renderSideBySide(tokens, idx, options, env, slf) {
    let token = tokens[idx];
    let markup = token.markup;
    let markupTokens = r.parse(markup, env);
    let contentBlocks: string[] = [];
    let currentBlock: string[] = [];

    const finishBlock = () => {
      if (currentBlock.length) {
        contentBlocks.push(
          `<div class="left">${currentBlock.join('\n')}</div>`
        );
        currentBlock = [];
      }
    };

    for (token of markupTokens) {
      if (token.type === 'fence') {
        if (!currentBlock.length) {
          // If we get two fences in a row, add an empty block to go on the left.
          currentBlock.push('');
        }
        finishBlock();
        contentBlocks.push(
          `<div class="right">${slf.render([token], options, env)}</div>`
        );
      } else {
        currentBlock.push(slf.render([token], options, env));
      }
    }

    finishBlock();

    let final = contentBlocks.join('\n');
    return final;
  }

  let defaultNormalize = r.normalizeLink;

  return (content: string, env: { url: string; host?: string }) => {
    let { url: base, host } = env;

    let lastSlash = base.lastIndexOf('/');
    let sameDir = base.slice(0, lastSlash + 1);

    // Convert links to absolute for RSS.
    r.normalizeLink = (url) => {
      if (!url.includes('//')) {
        if (url[0] === '#') {
          url = `${base}${url}`;
        } else if (!url.startsWith('/')) {
          if (/\.(svg|png|jpg|gif)$/.test(url)) {
            url = `/images/${url}`;
          } else {
            url = `${sameDir}${url}`;
          }
        }

        if (host) {
          url = `${host}${url}`;
        }
      }
      return defaultNormalize(url);
    };

    let renderEnv = {
      ...env,
      host: env.host || '',
    };

    return r.render(content, renderEnv);
  };
}
