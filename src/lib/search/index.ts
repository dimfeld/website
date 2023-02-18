import type { PostInfo } from '$lib/readPosts';
import { getContext, setContext } from 'svelte';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import sorter from 'sorters';

export interface TagsData {
  posts: string[];
}

export interface SearchContext {
  activeTag: Writable<string>;
  search: Writable<string>;
  postList: PostInfo[];
  postLookup: Map<string, PostInfo>;
  tags: Record<string, TagsData>;
  tagList: {
    id: string;
    label: string;
    posts: string[];
  }[];
  activePosts: Readable<PostInfo[]>;
}

export function searchContext(): SearchContext {
  return getContext('search');
}

export function createSearchContext(
  posts: PostInfo[],
  tags: Record<string, TagsData>
): SearchContext {
  let postLookup = new Map(posts.map((p) => [p.id, p]));

  let tagList = Object.entries(tags)
    .map(([key, val]) => {
      let label = key.replace(/-/g, ' ');
      return { id: key, label, ...val };
    })
    .sort(sorter('id'));

  const activeTag = writable('');
  const search = writable('');

  const activePosts = derived([activeTag, search], ([$activeTag, $search]) => {
    let filtered = posts;
    if ($activeTag) {
      filtered = (tags[$activeTag]?.posts ?? [])
        .map((id) => postLookup.get(id)!)
        .sort(sorter({ value: 'date', descending: true }));
    }

    filtered = filterText(filtered, $search);

    return filtered;
  });

  return setContext('search', {
    activeTag,
    activePosts,
    search,
    postList: posts,
    postLookup,
    tags,
    tagList,
  });
}

export function filterText(posts: PostInfo[], searchValue: string) {
  if (searchValue) {
    searchValue = searchValue.toLowerCase();
    return posts.filter((p: PostInfo) =>
      p.title.toLowerCase().includes(searchValue)
    );
  } else {
    return posts;
  }
}
