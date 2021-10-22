import frontMatter from 'front-matter';
import uniq from 'just-unique';
import * as path from 'path';
import globFn from 'glob';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { DevToArticle } from './devto';

const glob = promisify(globFn);

interface PostAttributes {
  title: string;
  tags: string;
  date: string;
  updated?: string;
  summary?: string;
  frontPageSummary?: string;
  cardImage?: string;
  content: string;
  confidence?: string;
  status_code?: string;
  draft?: boolean;
}

export interface Post {
  id: string;
  format: 'md' | 'html';
  type: 'post' | 'note';
  source?: 'roam';
  title: string;
  tags: string[];
  date: string;
  updated?: string;
  summary?: string;
  frontPageSummary?: string;
  cardImage?: string;
  content: string;
  confidence?: string;
  status_code?: string;
  devto?: DevToArticle;
}

export interface Source {
  ext: 'md' | 'html';
  type: 'post' | 'note';
  base: string;
}

export const postSources: Source[] = [
  {
    ext: 'md',
    type: 'post',
    base: 'posts',
  },
  {
    ext: 'html',
    type: 'post',
    base: 'posts',
  },
];

export const noteSources: Source[] = [
  {
    ext: 'md',
    type: 'note',
    base: 'notes',
  },
  {
    ext: 'html',
    type: 'note',
    base: 'notes',
  },
  {
    ext: 'html',
    type: 'note',
    base: 'roam-pages',
  },
];

export async function lookupContent(
  sources: Source[],
  name: string
): Promise<Post | null> {
  for (let source of sources) {
    let fullPath = path.join(
      process.cwd(),
      source.base,
      `${name}.${source.ext}`
    );

    try {
      let data = await fs.readFile(fullPath);
      let result = await processPost(name, data.toString());
      if (!result) {
        continue;
      }

      return { format: source.ext, type: source.type, ...result };
    } catch (e) {
      continue;
    }
  }

  return null;
}

function processPost(
  name: string,
  data: string
): Omit<Post, 'format' | 'type'> | null {
  let { attributes, body } = frontMatter<PostAttributes>(data);
  if (attributes.draft && process.env.NODE_ENV === 'production') {
    return null;
  }

  let metadataTags = (attributes.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  let pathTags = name.split('/').slice(0, -1);

  let content = body.trim();
  return {
    ...attributes,
    id: name,
    content,
    tags: uniq([...metadataTags, ...pathTags]),
  } as Post;
}

export async function readAllSources(sources: Source[]): Promise<Post[]> {
  let posts = await Promise.all(
    sources.map(async (source) => {
      let files = await glob(`${source.base}/**/*.${source.ext}`);
      return Promise.all(
        files.map(async (filename) => {
          let ext = path.extname(filename);
          let name = path.basename(filename);
          if (ext) {
            name = name.slice(0, -ext.length);
          }

          let data = await fs.readFile(filename);
          let result = processPost(name, data.toString());
          if (!result) {
            return null;
          }

          return { format: source.ext, type: source.type, ...result };
        })
      );
    })
  );

  return posts.flatMap((s) => s).filter(Boolean) as Post[];
}

export function stripContent(p: Post) {
  let { content, ...rest } = p;
  return rest;
}

// Sveltekit migration todo:
// - Link up dev.to to articles
// - lowercase note tags
