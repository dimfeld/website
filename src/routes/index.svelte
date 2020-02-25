<script context="module">
  export async function preload() {
    let post = await this.fetch('/api/posts/latest').then((r) => r.json());
    return { latestPost: post };
  }
</script>

<script>
  export let latestPost;
  import Article from './writing/_Article.svelte';
  import { getContext } from 'svelte';
  getContext('title').set('');
</script>

<div class="m-4">
  <h1 class="font-medium text-gray-700">Latest Post</h1>
  <h1 class="mx-2">
    <a href="writing/{latestPost.id}">{latestPost.title}</a>
  </h1>

  <p class="px-2">{latestPost.longSummary || latestPost.summary || ''}</p>

  <p class="mt-4">
    <a class="text-black" rel="prefetch" href="writing">See All Posts...</a>
  </p>
</div>
