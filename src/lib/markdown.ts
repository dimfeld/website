import markdownIt from 'markdown-it';
import highlight from 'highlight.js';
import hljsSvelte from 'highlightjs-svelte';
import footnote from 'markdown-it-footnote';
import abbr from 'markdown-it-abbr';
import toc from 'markdown-it-toc-done-right';
import anchor from 'markdown-it-anchor';
import container from '@gerhobbelt/markdown-it-container';
import StateCore from 'markdown-it/lib/rules_core/state_core';
import { transformLinkToAbsolute } from './transforms';

hljsSvelte(highlight);

function boxContainer(className: string) {
  return {
    render: function (tokens, idx) {
      let token = tokens[idx];
      if (token.nesting === 1) {
        return `<aside class="${className}">`;
      } else {
        return `</aside>`;
      }
    },
  };
}

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
      slugify: (s: string) => {
        return encodeURIComponent(
          String(s)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
        );
      },
    })
    .use(container, 'side-by-side', {
      content: renderSideBySide,
    })
    .use(container, 'note', boxContainer('note'))
    .use(container, 'warn', boxContainer('warn'));

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

    // Convert links to absolute for RSS.
    r.normalizeLink = (url) => {
      url = transformLinkToAbsolute(url, base, host);
      return defaultNormalize(url);
    };

    let renderEnv = {
      ...env,
      host: env.host || '',
    };

    return r.render(content, renderEnv);
  };
}
