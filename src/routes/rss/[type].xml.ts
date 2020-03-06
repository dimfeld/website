import renderFactory from '../../markdown';
import * as labels from '../../postMeta';
import orderBy from 'lodash/orderBy';
import RSS from 'rss';
import { Post } from '../../staticApi/readPosts';
import { postCache } from '../../staticApi/posts';

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
    let type = req.params.type;
    let host = `https://imfeld.dev`;

    let title = `Daniel Imfeld's blog`;
    let url = `${host}/rss/${type}.xml`;
    let posts: Post[];
    // Get whichever type of post we want. These are already sorted in descending date order so we
    // only need to sort again if combining them.
    if (type === 'writing') {
      posts = postCache.postList.slice(0, 10);
      title += ' - Writing';
    } else if (type === 'notes') {
      posts = postCache.noteList.slice(0, 10);
      title += ' - Notes';
    } else if (type === 'all') {
      title += ' - All Content';
      posts = orderBy(
        [...postCache.postList, ...postCache.noteList],
        'date',
        'desc'
      ).slice(0, 10);
    } else {
      return res.writeHead(404).end();
    }

    let render = renderFactory();

    let feed = new RSS({
      title,
      managingEditor: 'Daniel Imfeld',
      description: `Daniel Imfeld's Writing and Notes`,
      feed_url: url,
      site_url: host,
      copyright: 'Daniel Imfeld 2020',
      categories: ['technology', 'programming'],
      language: 'English',
    });

    for (let post of posts) {
      let type = post.type === 'post' ? 'writing' : 'notes';
      let path = `/${type}/${post.id}`;
      let fullUrl = `${host}${path}`;
      let desc;
      if (post.format === 'md') {
        let body = render(post.content, { url: path, host });
        desc = formatPostHeader(post) + body;
      } else {
        desc = post.summary || '';
      }

      feed.item({
        date: post.date,
        title: post.title,
        description: desc,
        url: fullUrl,
        categories: post.tags || [],
      });
    }

    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(feed.xml());
  } catch (e) {
    next(e);
  }
}
