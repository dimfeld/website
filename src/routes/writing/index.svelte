<script context="module">
  import { loadFetchJson } from '$lib/fetch';
  export async function load({ fetch }) {
    let result = await loadFetchJson(fetch, '/writing/list.json');
    if ('error' in result) {
      return result;
    }

    return {
      props: result.data,
    };
  }
</script>

<script>
  import PostList from '../_PostList.svelte';
  import { getContext } from 'svelte';
  export let posts;

  getContext('title').set('Writing');

  let activeTag;
  $: activePosts = posts.filter(
    (p) => !activeTag || (p.tags && p.tags.includes(activeTag))
  );
</script>

<svelte:head>
  <meta name="Description" content="Writing by Daniel Imfeld" />
</svelte:head>

<div class="ml-4">
  <div class="flex flex-row justify-center items-baseline flex-shrink">
    <PostList base="writing" posts={activePosts} />
  </div>

  <div class="text-center sm:text-left mt-8">
    <a href="/rss/writing.xml">Writing RSS Feed</a>
  </div>
</div>
