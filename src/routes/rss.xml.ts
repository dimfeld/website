import renderFactory from '../markdown';
import * as labels from '../postMeta';
import orderBy from 'lodash/orderBy';
import RSS from 'rss';
import { postCache, Post } from '../staticApi/posts';

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
    headerLines.push(`Status: ${post.status}`);
  }

  if (headerLines.length) {
    return `<p>${headerLines.join('<br />\n')}</p>`;
  } else {
    return '';
  }
}

export async function get(req, res, next) {
  try {
    let type = req.query.type;
    let host = `https://imfeld.dev`;

    let posts: Post[];
    // Get whichever type of post we want. These are already sorted in descending date order so we
    // only need to sort again if combining them.
    if (type === 'writing') {
      posts = postCache.postList.slice(0, 10);
    } else if (type === 'notes') {
      posts = postCache.noteList.slice(0, 10);
    } else {
      posts = orderBy(
        [...postCache.postList, ...postCache.noteList],
        'date',
        'desc'
      ).slice(0, 10);
    }

    let renderer = renderFactory();

    // Convert links to absolute for RSS.
    let defaultNormalize = renderer.normalizeLink;
    renderer.normalizeLink = (url) => {
      if (!url.includes('//') && !url.startsWith('/')) {
        url = `${host}/${url}`;
      }
      return defaultNormalize(url);
    };

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

    for (let post of posts) {
      let type = post.type === 'post' ? 'writing' : 'notes';
      let url = `${host}/${type}/${post.id}`;
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
        categories: post.tags || [],
      });
    }

    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(feed.xml());
  } catch (e) {
    next();
  }
}
