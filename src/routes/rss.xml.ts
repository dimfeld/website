import { getAll, renderer } from './api/posts/_readPost';
import orderBy from 'lodash/orderBy';
import RSS from 'rss';

export async function get(req, res, next) {
  try {
    let posts = await getAll();
    posts = orderBy(posts, 'date', 'desc').slice(0, 10);

    let feed = new RSS({
      title: `Daniel Imfeld's blog`,
      description: 'Tech writing from Daniel Imfeld',
      feed_url: 'https://imfeld.dev/rss.xml',
      site_url: 'https://imfeld.dev/',
      copyright: 'Daniel Imfeld 2020-',
      categories: ['technology', 'programming'],
      language: 'English',
    });

    let baseUrl = `https://imfeld.dev/writing/`;
    for (let post of posts) {
      feed.item({
        date: post.date,
        title: post.title,
        description:
          post.format === 'md' ? renderer.render(post.content) : post.summary,
        url: baseUrl + post.id,
        categories: (post.tags || '').split(',').map((t) => t.trim()),
      });
    }

    res.setHeader('Content-Type', 'application/rss+xml');
    res.end(feed.xml());
  } catch (e) {
    next();
  }
}
