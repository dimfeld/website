import frontMatter from 'front-matter';
import uniq from 'just-unique';
import { DevToArticle } from './devto';

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
  content: Record<string, () => Promise<string>>;
}

export const postSources: Source[] = [
  {
    ext: 'md',
    type: 'post',
    base: '../../posts/',
    content: import.meta.glob('../../posts/*.md'),
  },
  {
    ext: 'html',
    type: 'post',
    base: '../../posts/',
    content: import.meta.glob('../../posts/*.html'),
  },
];

export const noteSources: Source[] = [
  {
    ext: 'md',
    type: 'note',
    base: '../../notes/',
    content: import.meta.glob('../../notes/**/*.md'),
  },
  {
    ext: 'html',
    type: 'note',
    base: '../../notes/',
    content: import.meta.glob('../../notes/**/*.html'),
  },
  {
    ext: 'html',
    type: 'note',
    base: '../../roam-pages/',
    content: import.meta.glob('../../roam-pages/*.html'),
  },
];

export async function lookupContent(
  sources: Source[],
  name: string
): Promise<Post | null> {
  for (let source of sources) {
    let importFn = source.content[`${source.base}${name}.${source.ext}`];
    if (importFn) {
      let result = await processPost(name, importFn);
      if (!result) {
        return null;
      }

      return { format: source.ext, type: source.type, ...result };
    }
  }

  return null;
}

async function processPost(
  id: string,
  dataFn: () => Promise<string>
): Promise<Omit<Post, 'format' | 'type'> | null> {
  let data = await dataFn();
  let { attributes, body } = frontMatter<PostAttributes>(data.toString());
  if (attributes.draft && process.env.NODE_ENV === 'production') {
    return null;
  }

  let metadataTags = (attributes.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  let pathTags = id.split('/').slice(0, -1);

  let content = body.trim();
  return {
    ...attributes,
    id,
    content,
    tags: uniq([...metadataTags, ...pathTags]),
  } as Post;
}

export async function readAllSources(sources: Source[]): Promise<Post[]> {
  let posts = await Promise.all(
    sources.flatMap((source) =>
      Object.entries(source.content).map(async ([key, importFn]) => {
        let name = key.slice(source.base.length);
        let result = await processPost(name, importFn);
        if (!result) {
          return null;
        }

        return { format: source.ext, type: source.type, ...result };
      })
    )
  );

  return posts.filter(Boolean) as Post[];
}

export function stripContent(p: Post) {
  let { content, ...rest } = p;
  return rest;
}

// Sveltekit migration todo:
// - Link up dev.to to articles
// - lowercase note tags
