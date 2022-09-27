import frontMatter from 'front-matter';
import uniq from 'just-unique';
import * as path from 'path';
import globFn from 'glob';
import { promisify } from 'util';
import { promises as fs } from 'fs';

const glob = promisify(globFn);

interface PostAttributes {
  title: string;
  tags: string;
  date: Date | string;
  updated?: Date | string;
  summary?: string;
  frontPageSummary?: string;
  cardImage?: string;
  content: string;
  confidence?: string;
  status_code?: string;
  draft?: boolean;
}

export type PostType = 'post' | 'note' | 'journal';

export interface Post {
  id: string;
  format: 'md' | 'html';
  type: PostType;
  source?: 'pkm';
  title: string;
  tags: string[];
  date: string;
  updated?: string;
  summary?: string;
  frontPageSummary?: string;
  cardType?: string;
  cardImage?: string;
  content: string;
  confidence?: string;
  status_code?: string;
}

export interface Source {
  ext: 'md' | 'html';
  type: PostType;
  files: Record<string, string>;
  source?: 'pkm';
}

function stripGlobbedPrefix(prefix: string, files: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(files).map(([path, content]) => [
      path.slice(prefix.length),
      content,
    ])
  );
}

export const postSources: Source[] = [
  {
    ext: 'md',
    type: 'post',
    files: stripGlobbedPrefix(
      '../../posts/',
      import.meta.glob('../../posts/*.md', { as: 'raw', eager: true })
    ),
  },
  {
    ext: 'html',
    type: 'post',
    files: stripGlobbedPrefix(
      '../../posts/',
      import.meta.glob('../../posts/*.html', { as: 'raw', eager: true })
    ),
  },
];

export const noteSources: Source[] = [
  {
    ext: 'md',
    type: 'note',
    files: stripGlobbedPrefix(
      '../../notes/',
      import.meta.glob('../../notes/*.md', { as: 'raw', eager: true })
    ),
  },
  {
    ext: 'html',
    type: 'note',
    files: stripGlobbedPrefix(
      '../../notes/',
      import.meta.glob('../../notes/*.html', { as: 'raw', eager: true })
    ),
  },
  {
    ext: 'html',
    type: 'note',
    files: stripGlobbedPrefix(
      '../../pkm-pages/notes/',
      import.meta.glob('../../pkm-pages/notes/*.html', {
        as: 'raw',
        eager: true,
      })
    ),
    source: 'pkm',
  },
];

export const journalSources: Source[] = [
  {
    ext: 'html',
    type: 'journal',
    files: stripGlobbedPrefix(
      '..././pkm-pages/journals/',
      import.meta.glob('../../pkm-pages/journals/*.html', {
        as: 'raw',
        eager: true,
      })
    ),
    source: 'pkm',
  },
];

export function lookupContent(sources: Source[], name: string): Post | null {
  for (let source of sources) {
    try {
      let key = `${name}.${source.ext}`;
      let data = source.files[key];
      if (!data) {
        continue;
      }

      let result = processPost(name, data.toString());
      if (!result) {
        continue;
      }

      return {
        format: source.ext,
        type: source.type,
        source: source.source,
        ...result,
      };
    } catch (e) {
      continue;
    }
  }

  return null;
}

/** Convert a date back to a simple date-only value. This is a workaround for front-matter parsing date-like strings
 * into actual Date objects. */
function handleDate(value: string | Date | undefined) {
  if (value instanceof Date) {
    let y = value.getUTCFullYear();
    let m = (value.getUTCMonth() + 1).toString().padStart(2, '0');
    let d = value.getUTCDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return value;
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

  let pathTags = name
    .split('/')
    .slice(0, -1)
    .map((tag) => {
      return tag.replace(/_/g, ' ');
    });

  let content = body.trim();
  return {
    ...attributes,
    date: handleDate(attributes.date),
    updated: handleDate(attributes.updated),
    id: name,
    content,
    tags: uniq([...metadataTags, ...pathTags]),
  } as Post;
}

export function readAllSources(sources: Source[]): Post[] {
  let posts = sources.map((source) => {
    return Object.entries(source.files).map(([filename, data]) => {
      let ext = path.extname(filename);
      let name = filename;
      if (ext) {
        name = name.slice(0, -ext.length);
      }

      let result = processPost(name, data);
      if (!result) {
        return null;
      }

      return { format: source.ext, type: source.type, ...result };
    });
  });

  return posts.flatMap((s) => s).filter(Boolean) as Post[];
}

export function stripContent(p: Post) {
  let { content, ...rest } = p;
  return rest;
}

// Sveltekit migration todo:
// - Link up dev.to to articles
// - lowercase note tags
