import maxBy from 'lodash/maxBy';
import {
  postsDir,
  notesDir,
  roamDir,
  readMdFiles,
  readHtmlFiles,
  Post,
  DevToArticle,
} from './readPosts';
import partition from 'just-partition';
import send from '@polka/send-type';
import sorter from 'sorters';
import { Dictionary } from 'lodash';
import { IncomingMessage, ServerResponse } from 'http';
import md from '../markdown';
import got from 'got';

type Request = IncomingMessage & {
  params: Record<string, string>;
  path: string;
};

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

function readDevTo() {
  let devtoApiKey = process.env.DEVTO_API_KEY;
  if (devtoApiKey) {
    return got('https://dev.to/api/articles/me/published', {
      headers: { api_key: devtoApiKey },
    }).json<DevToArticle[]>();
  } else {
    return [];
  }
}

export async function initPostCache() {
  let [
    mdPosts,
    htmlPosts,
    mdNotes,
    htmlNotes,
    roamPages,
    devtoArticleList,
  ] = await Promise.all([
    readMdFiles(postsDir, 'post'),
    readHtmlFiles(postsDir, 'post'),
    readMdFiles(notesDir, 'note'),
    readHtmlFiles(notesDir, 'note'),
    readHtmlFiles(roamDir, 'note'),
    readDevTo(),
  ]);

  for (let page of roamPages) {
    page.source = 'roam';
  }

  // All roam-exported pages are together, so determine which ones are "posts"
  // by the presence of the Writing tag.
  let [roamPosts, roamNotes] = partition(roamPages, (p) =>
    p.tags.includes('Writing')
  );

  for (let p of roamPosts) {
    p.type = 'post';
  }

  let postList = [...mdPosts, ...htmlPosts, ...roamPosts];
  let noteList = [...mdNotes, ...htmlNotes, ...roamNotes];

  let devtoArticles: _.Dictionary<DevToArticle> = {};
  for (let devtoArticle of devtoArticleList) {
    let postId = devtoArticle.canonical_url.split('/').slice(-1)[0];
    devtoArticles[postId] = devtoArticle;
  }

  postList.sort(
    sorter(
      { value: 'date', descending: true },
      { value: 'title', descending: false }
    )
  );
  noteList.sort(
    sorter(
      { value: (n) => n.updated || n.date, descending: true },
      { value: 'title', descending: false }
    )
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
      tag = tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
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

export function allPosts(_req: Request, res: ServerResponse) {
  send(res, 200, postCache.postList.map(stripContent));
}

export function latestPost(_req: Request, res: ServerResponse) {
  let { content: postContent, ...post } = postCache.postList[0];
  let { content: noteContent, ...note } = postCache.noteList[0];
  let { content: _, ...lastCreatedNote } = maxBy(
    postCache.noteList,
    (p) => p.date
  )!;

  send(res, 200, {
    post,
    lastCreatedNote,
    note,
  });
}

export function getPost(req: Request, res: ServerResponse) {
  let post = postCache.posts.get(req.params.id);
  if (post) {
    let content =
      post.format === 'md'
        ? renderer(post.content, {
            url: `/writing/${post.id}`,
          })
        : post.content;
    post = {
      ...post,
      content,
    };
    send(res, 200, post);
  } else {
    res.writeHead(404).end();
  }
}

export function allNotes(_req: Request, res: ServerResponse) {
  send(res, 200, postCache.noteList.map(stripContent));
}

export function getNote(req: Request, res: ServerResponse) {
  // req.params['*'] only contains the first path component so we have to do this.
  let id = req.path.slice('/static-api/notes/'.length);
  let post = postCache.notes.get(id);

  if (post) {
    let content =
      post.format === 'md'
        ? renderer(post.content, { url: `/notes/${post.id}` })
        : post.content;
    post = {
      ...post,
      content,
    };

    send(res, 200, post);
  } else {
    res.writeHead(404).end(id);
  }
}

export function noteTags(_req: Request, res: ServerResponse) {
  let output: Dictionary<{ posts: string[] }> = {};
  for (let [tagName, tagPosts] of postCache.tags.entries()) {
    output[tagName] = { posts: tagPosts.map((p) => p.id) };
  }

  send(res, 200, output);
}

export function getTag(req: Request, res: ServerResponse) {
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
