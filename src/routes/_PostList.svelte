<script>
  import capitalize from 'lodash/capitalize';
  import { flip } from 'svelte/animate';
  export let posts;
  export let base;

  function tagLabels(tags) {
    return (tags || []).map((t) => capitalize(t.replace(/_/g, ' '))).join(', ');
  }
</script>

<div
  class="w-full flex flex-col items-stretch sm:grid sm:max-w-none gap-8 sm:mt-4"
  style="grid-template-columns: repeat(auto-fit, 400px);">
  {#each posts as post (post.id)}
    <div
      animate:flip={{ duration: 300 }}
      class="sm:rounded-sm border-b sm:border border-teal-100 sm:border-teal-100
      p-2 sm:shadow-md flex-1 flex flex-col">
      <a rel="prefetch" href="{base}/{post.id}" class="text-lg">{post.title}</a>
      <a
        class="hover:no-underline text-gray-800 font-medium text-sm"
        rel="prefetch"
        href="{base}/{post.id}">
        <p>{post.summary || ''}</p>
      </a>
      <p class="flex flex-row text-sm mt-auto pt-2">
        <span>{tagLabels(post.tags)}</span>
        {#if post.date}
          <time class="ml-auto">{post.date.slice(0, 10)}</time>
        {/if}
      </p>
    </div>
  {/each}
</div>
