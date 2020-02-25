<script context="module">
  export async function preload() {
    let posts = await this.fetch('/api/posts/all').then((r) => r.json());
    return { posts };
  }
</script>

<script>
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
    let tags = post.tags ? post.tags.split(',').map((t) => t.trim()) : [];
    for (let tag of tags) {
      tagsSet.add(tag);
    }
  }

  let tags = Array.from(tagsSet).sort();
</script>

<div class="flex flex-row justify-center items-baseline flex-shrink">
  <!-- <div class="flex flex-col ml-4 mt-4" style="width:15ch">
    <a
      class:bg-gray-300={!activeTag}
      class="p-1"
      href="#all-tags"
      on:click|preventDefault={() => (activeTag = null)}>
      All Tags
    </a>
    {#each tags as tag}
      <a
        href="#{tag}"
        on:click|preventDefault={() => (activeTag = tag)}
        class:bg-gray-300={activeTag === tag}
        class="cursor-pointer p-1 mt-1">
        {tag}
      </a>
    {/each}
  </div> -->
  <!-- <div class="flex flex-row flex-shrink flex-wrap justify-center"> -->
  <div
    class="w-full flex flex-col items-stretch sm:grid max-w-lg w-64
    sm:max-w-none"
    style="grid-template-columns: repeat(auto-fit, 300px);">
    {#each activePosts as post (post.id)}
      <div
        animate:flip={{ duration: 300 }}
        transition:blur|local
        class="rounded-sm border border-teal-700 p-2 m-4 shadow-md flex-1 flex
        flex-col">
        <a rel="prefetch" href="writing/{post.id}" class="text-lg">
          {post.title}
        </a>
        <a
          class="hover:no-underline text-black"
          rel="prefetch"
          href="writing/{post.id}">
          <p>{post.summary || ''}</p>
        </a>
        <p class="flex flex-row text-sm text-right mt-auto pt-2">
          <span>{post.tags}</span>
          <time class="ml-auto">{post.date.slice(0, 10)}</time>
        </p>
      </div>
    {/each}
  </div>

</div>
