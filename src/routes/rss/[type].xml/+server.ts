import { error } from '@sveltejs/kit';
import { createHash } from 'crypto';
import renderFactory from '$lib/markdown';
import cheerio from 'cheerio';
import * as labels from '../../../postMeta';
import RSS from 'rss';
import sorter from 'sorters';
import {
  type Post,
  noteSources,
  postSources,
  journalSources,
  readAllSources,
  type PostType,
} from '$lib/readPosts';
import { transformLinkToAbsolute, journalLink } from '$lib/transforms';

export let prerender = true;

let statuses: any = {};
for (let status of labels.statuses) {
  statuses[status.id] = status;
}

function formatPostHeader(post: Post) {
  let headerLines = [];

  if (post.tags && post.tags.length) {
    headerLines.push(`Tags: ${post.tags.join(', ')}`);
  }

  if (post.status) {
    headerLines.push(`Confidence: ${post.confidence}`);
  }

  if (headerLines.length) {
    return `<p>${headerLines.join('<br />\n')}</p>`;
  } else {
    return '';
  }
}

export async function GET({ params }) {
  let type = params.type;
  let host = `https://imfeld.dev`;

  let title = `Daniel Imfeld's blog`;
  let url = `${host}/rss/${type}.xml`;
  let posts: Post[];
  // Get whichever type of post we want. These are already sorted in descending date order so we
  // only need to sort again if combining them.
  if (type === 'writing') {
    posts = readAllSources(postSources);
    title += ' - Writing';
  } else if (type === 'journals') {
    posts = readAllSources(journalSources);
    title += ' - Notes';
  } else if (type === 'notes') {
    posts = readAllSources(noteSources);
    title += ' - Notes';
  } else if (type === 'all') {
    title += ' - All Content';
    let p = readAllSources(postSources);
    let n = readAllSources(noteSources);
    let j = readAllSources(journalSources);
    posts = [...p, ...n, ...j];
  } else {
    error(404, 'not found');
  }

  posts = posts.sort(sorter({ value: 'date', descending: true })).slice(0, 20);

  let render = renderFactory();

  let feed = new RSS({
    title,
    managingEditor: 'Daniel Imfeld',
    description: `Daniel Imfeld's Writing and Notes`,
    feed_url: url,
    site_url: host,
    copyright: 'Daniel Imfeld 2021',
    categories: ['technology', 'programming'],
    language: 'English',
  });

  const urlBases: Record<PostType, string> = {
    post: 'writing',
    note: 'notes',
    journal: 'journals',
  };

  for (let post of posts) {
    let type = urlBases[post.type];
    let path =
      post.type === 'journal' ? journalLink(post.id) : `/${type}/${post.id}`;
    let fullUrl = `${host}${path}`;
    let desc;
    if (post.format === 'md') {
      let body = render(post.content, { url: path, host });
      desc = formatPostHeader(post) + body;
    } else if (post.format === 'html') {
      desc = post.content;
    } else {
      desc = post.summary || '';
    }

    let $ = cheerio.load(desc);
    $('div[data-component]')
      .not('[data-no-fallback]')
      .filter((i, el) => {
        return $(el).text().trim().length === 0;
      })
      .append(
        `<p><a href="${fullUrl}">View this post on the website</a> for an interactive example.</p>`
      );

    $('a').each((i, el) => {
      el.attribs.href = transformLinkToAbsolute(el.attribs.href, path, host);
    });

    desc = $.html();

    let guid = createHash('sha256').update(desc).digest('hex');

    feed.item({
      date: post.date,
      title: post.title,
      description: desc,
      url: fullUrl,
      categories: post.tags || [],
      guid,
    });
  }

  return new Response(feed.xml(), {
    headers: {
      'Content-Type': 'application/rss+xml',
    },
  });
}
