<script lang="ts">
  import { searchContext } from '$lib/search';
  import { getContext } from 'svelte';
  import PostList from '../_PostList.svelte';

  const { activePosts } = searchContext();
  getContext('title').set('Notes');
</script>

<svelte:head>
  <meta name="Description" content="Notes by Daniel Imfeld" />
</svelte:head>

<PostList base="notes" posts={$activePosts} useUpdatedDate={true} />

<div class="mt-8 text-center sm:hidden">
  <a href="/rss/notes.xml">Notes RSS Feed</a>
</div>
