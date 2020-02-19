<script context="module">
  export async function preload() {
    let posts = await this.fetch('/api/posts/all').then((r) => r.json());
    return { posts };
  }
</script>

<script>
  import { blur } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  export let posts;

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

<div class="flex flex-row">
  <div class="flex flex-col w-1/4 ml-4 mt-4">
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
  </div>
  <div class="flex flex-row sm:w-3/4 ml-auto mr-auto">
    {#each activePosts as post (post.id)}
      <div
        animate:flip={{ duration: 300 }}
        transition:blur|local
        class="border border-teal-700 p-2 m-4 shadow-md">
        <p class="text-lg">
          <a rel="prefetch" href="writing/{post.id}">{post.title}</a>
        </p>
        <p>{post.summary}</p>
        <p class="flex flex-row text-sm text-right">
          <span>{post.tags}</span>
          <span class="ml-auto">{post.date}</span>
        </p>
      </div>
    {/each}
  </div>

</div>
