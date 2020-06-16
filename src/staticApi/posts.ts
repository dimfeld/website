import orderBy from 'lodash/orderBy';
import maxBy from 'lodash/maxBy';
import {
  postsDir,
  notesDir,
  readMdFiles,
  Post,
  DevToArticle,
} from './readPosts';
import send from '@polka/send-type';
import { Dictionary } from 'lodash';
import { IncomingMessage, ServerResponse } from 'http';
import md from '../markdown';
import got from 'got';

const renderer = md();

export interface PostCache {
  tags: Map<string, Post[]>;
  postList: Post[];
  noteList: Post[];
  posts: Map<string, Post>;
  notes: Map<string, Post>;
}

function stripContent(p: Post) {
  let { content, ...rest } = p;
  return rest;
}

export var postCache: PostCache;

export async function initPostCache() {
  let devtoApiKey = process.env.DEVTO_API_KEY;
  let [postList, noteList, devtoArticleList] = await Promise.all([
    readMdFiles(postsDir, 'post'),
    readMdFiles(notesDir, 'note'),
    devtoApiKey
      ? got('https://dev.to/api/articles/me/published', {
          headers: { api_key: devtoApiKey },
        }).json<DevToArticle[]>()
      : [],
  ]);

  let devtoArticles: _.Dictionary<DevToArticle> = {};
  for (let devtoArticle of devtoArticleList) {
    let postId = devtoArticle.canonical_url.split('/').slice(-1)[0];
    devtoArticles[postId] = devtoArticle;
  }

  postList = orderBy(postList, ['date', 'title'], ['desc', 'asc']);
  noteList = orderBy(
    noteList,
    [(n) => n.updated || n.date, 'title'],
    ['desc', 'asc']
  );

  let tags = new Map<string, Post[]>();
  let postOutput = new Map<string, Post>();
  let noteOutput = new Map<string, Post>();

  for (let post of postList) {
    post.devto = devtoArticles[post.id];
    postOutput.set(post.id, post);
  }

  for (let note of noteList) {
    noteOutput.set(note.id, note);
    for (let tag of note.tags) {
      let tagNotes = tags.get(tag);
      if (tagNotes) {
        tagNotes.push(note);
      } else {
        tags.set(tag, [note]);
      }
    }
  }

  postCache = {
    tags,
    postList,
    noteList,
    notes: noteOutput,
    posts: postOutput,
  };
}

export function allPosts(req, res) {
  send(res, 200, postCache.postList.map(stripContent));
}

export function latestPost(req, res) {
  let { content: postContent, ...post } = postCache.postList[0];
  let { content: noteContent, ...note } = postCache.noteList[0];
  let { content: _, ...lastCreatedNote } = maxBy(
    postCache.noteList,
    (p) => p.date
  );

  send(res, 200, {
    post,
    lastCreatedNote,
    note,
  });
}

export function getPost(req, res) {
  let post = postCache.posts.get(req.params.id);
  if (post) {
    post = {
      ...post,
      content: renderer(post.content, {
        url: `/writing/${post.id}`,
      }),
    };
    send(res, 200, post);
  } else {
    res.writeHead(404).end();
  }
}

export function allNotes(req, res) {
  send(res, 200, postCache.noteList.map(stripContent));
}

export function getNote(req, res: ServerResponse) {
  // req.params['*'] only contains the first path component so we have to do this.
  let id = req.path.slice('/static-api/notes/'.length);
  let post = postCache.notes.get(id);

  if (post) {
    post = {
      ...post,
      content: renderer(post.content, { url: `/notes/${post.id}` }),
    };

    send(res, 200, post);
  } else {
    res.writeHead(404).end(id);
  }
}

export function noteTags(req, res) {
  let output: Dictionary<{ posts: string[] }> = {};
  for (let [tagName, tagPosts] of postCache.tags.entries()) {
    output[tagName] = { posts: tagPosts.map((p) => p.id) };
  }

  send(res, 200, output);
}

export function getTag(req, res) {
  let tagNotes = postCache.tags.get(req.params.id);
  if (!tagNotes) {
    return res.writeHead(404).end();
  }

  let strippedNotes = tagNotes.map((note) => {
    let { content, ...rest } = note;
    return rest;
  });

  send(res, 200, strippedNotes);
}
