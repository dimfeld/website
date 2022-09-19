<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '../_PostList.svelte';
  import { getContext } from 'svelte';
  export let data: PageData;

  getContext('title').set('Writing');

  let activeTag;
  $: activePosts = data.posts.filter(
    (p) => !activeTag || (p.tags && p.tags.includes(activeTag))
  );
</script>

<svelte:head>
  <meta name="Description" content="Writing by Daniel Imfeld" />
</svelte:head>

<div class="ml-4">
  <div class="flex flex-shrink flex-row items-baseline justify-center">
    <PostList base="writing" posts={activePosts} />
  </div>

  <div class="mt-8 text-center sm:text-left">
    <a href="/rss/writing.xml">Writing RSS Feed</a>
  </div>
</div>
