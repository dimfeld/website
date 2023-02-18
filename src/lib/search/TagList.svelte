<script lang="ts">
  import type { PostInfo } from '$lib/readPosts';
  import { searchContext } from '$lib/search';
  import { createEventDispatcher } from 'svelte';

  export let currentPost: PostInfo | null = null;
  export let postType: string;
  export let baseUrl: string;

  const dispatch = createEventDispatcher();

  const { search, activeTag, postLookup, tagList } = searchContext();

  $: tagElements = tagList.map((t) => {
    let count = t.posts.length;
    if ($search) {
      let searchValue = $search.toLowerCase();
      count = t.posts.reduce((acc, postId) => {
        let post = postLookup.get(postId);
        if (post && post.title.toLowerCase().includes(searchValue)) {
          return acc + 1;
        } else {
          return acc;
        }
      }, 0);
    }

    let selected = currentPost
      ? currentPost.tags.includes(t.id)
      : $activeTag === t.id;

    return {
      ...t,
      selected,
      count,
    };
  });

  const selectedDivClasses =
    'group flex items-center px-3 py-2 text-sm leading-5 font-medium text-gray-900 sm:rounded-md bg-gray-200 hover:text-gray-900 focus:outline-none focus:bg-gray-300 transition ease-in-out duration-150 hover:no-underline';
  const unselectedDivClasses =
    'group flex items-center px-3 py-2 text-sm leading-5 font-medium text-gray-600 sm:rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-200 transition ease-in-out duration-150 hover:no-underline';

  const selectedBubbleClasses =
    'ml-auto inline-block py-0.5 px-3 text-xs leading-4 rounded-full bg-gray-50 group-focus:bg-gray-100 transition ease-in-out duration-150';
  const unselectedBubbleClasses =
    'ml-auto inline-block py-0.5 px-3 text-xs leading-4 rounded-full text-gray-600 bg-gray-200 group-hover:bg-gray-200 group-focus:bg-gray-300 transition ease-in-out duration-150';
</script>

<nav class="flex flex-col">
  <a
    href={baseUrl}
    on:click={() => dispatch('change', '')}
    class={!$activeTag && !currentPost
      ? selectedDivClasses
      : unselectedDivClasses}>
    <span class="truncate group-hover:underline">All {postType}s</span>
  </a>
  {#each tagElements as tag (tag.id)}
    <a
      href="{baseUrl}?tag={tag.id}"
      aria-roledescription="{postType}s tagged {tag.id}"
      on:click={() => dispatch('change', tag.id)}
      class="mt-1 {tag.selected ? selectedDivClasses : unselectedDivClasses}">
      <span class="truncate group-hover:underline">{tag.label}</span>
      {#if tag.count}
        <span
          class={tag.selected
            ? selectedBubbleClasses
            : unselectedBubbleClasses}>
          {tag.count}
        </span>
      {/if}
    </a>
  {/each}
</nav>
