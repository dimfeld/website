import { getAll, Post } from './api/posts/_readPost';
import renderFactory from '../markdown';
import * as labels from '../postMeta';
import orderBy from 'lodash/orderBy';
import RSS from 'rss';

let statuses: any = {};
for (let status of labels.statuses) {
  statuses[status.id] = status;
}

function formatPostHeader(post: Post) {
  let headerLines = [];

  if (post.epistemic_status) {
    let status = statuses[post.epistemic_status];
    let statusText = status ? status.long : post.epistemic_status;
    if (statusText) {
      headerLines.push(`Epistemic Status: ${statusText}`);
    }
  }

  if (post.epistemic_effort) {
    headerLines.push(`Epistemic Effort: ${post.epistemic_effort}`);
  }

  if (headerLines.length) {
    return `<p>${headerLines.join('<br />\n')}</p>`;
  } else {
    return '';
  }
}

export async function get(req, res, next) {
  try {
    let host = `https://imfeld.dev`;

    let renderer = renderFactory();

    // Convert links to absolute for RSS.
    let defaultNormalize = renderer.normalizeLink;
    renderer.normalizeLink = (url) => {
      if (!url.includes('//') && !url.startsWith('/')) {
        url = `${host}/${url}`;
      }
      return defaultNormalize(url);
    };

    let posts = await getAll();
    posts = orderBy(posts, 'date', 'desc').slice(0, 10);

    let feed = new RSS({
      title: `Daniel Imfeld's blog`,
      managingEditor: 'Daniel Imfeld',
      description: 'Tech writing from Daniel Imfeld',
      feed_url: `${host}/rss.xml`,
      site_url: host,
      copyright: 'Daniel Imfeld 2020',
      categories: ['technology', 'programming'],
      language: 'English',
    });

    let baseUrl = `${host}/writing/`;
    for (let post of posts) {
      let url = baseUrl + post.id;
      let desc;
      if (post.format === 'md') {
        let body = renderer.render(post.content, { base: url });
        desc = formatPostHeader(post) + body;
      } else {
        desc = post.summary;
      }

      feed.item({
        date: post.date,
        title: post.title,
        description: desc,
        url,
        categories: (post.tags || '').split(',').map((t) => t.trim()),
      });
    }

    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(feed.xml());
  } catch (e) {
    next();
  }
}
