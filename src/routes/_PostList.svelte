<script lang="ts">
  import { cardImageUrl } from '../postMeta';
  import { formatTag } from '$lib/tags';
  import { flip } from 'svelte/animate';
  import type { PostInfo } from '$lib/readPosts';

  export let posts: PostInfo[];
  export let base: string;
  export let useUpdatedDate = false;

  function tagLabels(tags: string[] | undefined) {
    return (tags || []).map((t) => formatTag(t)).join(', ');
  }

  function backgroundImage(post: PostInfo) {
    if (post.cardImage) {
      let image = `background-color:white;background-image:url(${cardImageUrl(
        post,
        false
      )});`;

      let vars = post.cardImageFilter
        ? `--post-bg-filter:${post.cardImageFilter};`
        : '';

      return image + vars;
    }
  }
</script>

<div
  class="post-list flex flex-col items-stretch md:mt-4 md:grid
  md:max-w-7xl md:justify-center md:gap-8 md:px-4 xl:gap-x-12">
  {#each posts as post (post.id)}
    <div
      animate:flip={{ duration: 300 }}
      class="flex flex-1 flex-col border-b border-teal-100
      p-2 md:rounded-sm md:border md:border-teal-100 md:shadow-md">
      {#if post.cardImage}
        <div class="post-bg" style={backgroundImage(post)} />
      {/if}
      <a
        data-sveltekit-preload-data
        data-sveltekit-preload-code
        href="{base}/{post.id}"
        class="text-lg text-teal-900">
        {post.title}
      </a>
      {#if post.summary}
        <a
          class="text-sm font-medium text-gray-800 hover:no-underline"
          data-sveltekit-preload-data
          data-sveltekit-preload-code
          href="{base}/{post.id}">
          <p>{post.summary || ''}</p>
        </a>
      {/if}
      <p class="mt-auto flex flex-row items-end justify-between pt-2 text-sm">
        <span>{tagLabels(post.tags)}</span>
        {#if post.date}
          <time class="whitespace-nowrap pl-2">
            {useUpdatedDate && post.updated
              ? post.updated.slice(0, 10)
              : post.date.slice(0, 10)}
          </time>
        {/if}
      </p>
    </div>
  {/each}
</div>

<style lang="postcss">
  .post-bg {
    @apply absolute left-0 top-0 block h-full w-full;
    z-index: -1;
    background-repeat: no-repeat;
    background-position-y: center;
    background-size: 100%;
    opacity: 0.2;
    filter: var(--post-bg-filter, brightness(155%) saturate(200%));
  }

  @screen md {
    .post-list {
      grid-template-columns: repeat(auto-fill, 240px);
    }
  }

  @screen lg {
    .post-list {
      grid-template-columns: repeat(auto-fill, 275px);
    }
  }

  @screen xl {
    .post-list {
      grid-template-columns: repeat(auto-fill, 300px);
    }
  }
</style>
