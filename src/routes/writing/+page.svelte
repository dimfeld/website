<script lang="ts">
  import type { PageData } from './$types';
  import PostList from '../_PostList.svelte';
  import { getContext } from 'svelte';
  import Sidebar from '$lib/search/Sidebar.svelte';
  import { createSearchContext } from '$lib/search';

  export let data: PageData;

  const { activePosts } = createSearchContext(data.posts, data.tags);
  getContext('title').set('Writing');
</script>

<svelte:head>
  <meta name="Description" content="Writing by Daniel Imfeld" />
</svelte:head>

<div class="flex w-full flex-col sm:flex-row">
  <Sidebar
    baseUrl="/writing"
    postType="Post"
    rss={{ title: 'Writing RSS', url: '/rss/writing.xml' }} />
  <div class="min-w-0 flex-1 overflow-y-auto">
    <PostList base="writing" posts={$activePosts} />
  </div>
</div>
