<script context="module">
  export async function preload() {
    let posts = await this.fetch('/data/allPosts').then((r) => r.json());
    return { posts };
  }
</script>

<script>
  import PostList from '../_PostList.svelte';
  import { blur } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { getContext } from 'svelte';
  export let posts;

  getContext('title').set('Writing');

  let activeTag;
  $: activePosts = posts.filter(
    (p) => !activeTag || (p.tags && p.tags.includes(activeTag))
  );

  let tagsSet = new Set();
  for (let post of posts) {
    for (let tag of post.tags || []) {
      tagsSet.add(tag);
    }
  }

  let tags = Array.from(tagsSet).sort();
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
