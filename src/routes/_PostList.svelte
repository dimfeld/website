<script>
  import { cardImageUrl } from '../postMeta';

  import capitalize from 'just-capitalize';
  import { flip } from 'svelte/animate';
  export let posts;
  export let base;
  export let useUpdatedDate = false;

  function tagLabels(tags) {
    return (tags || [])
      .map((t) => {
        return t
          .split(' ')
          .map((word) => {
            if (word !== word.toUpperCase()) {
              word = capitalize(word);
            }
            return word;
          })
          .join(' ');
      })
      .join(', ');
  }

  function backgroundImage(post) {
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
  class="post-list flex w-full flex-col items-stretch sm:mt-4 sm:grid
  sm:max-w-7xl sm:justify-center sm:gap-8 sm:px-4 xl:gap-x-12">
  {#each posts as post (post.id)}
    <div
      animate:flip={{ duration: 300 }}
      class="flex flex-1 flex-col border-b border-teal-100
      p-2 sm:rounded-sm sm:border sm:border-teal-100 sm:shadow-md">
      {#if post.cardImage}
        <div class="post-bg" style={backgroundImage(post)} />
      {/if}
      <a
        sveltekit:prefetch
        href="{base}/{post.id}"
        class="text-lg text-teal-900">
        {post.title}
      </a>
      {#if post.summary}
        <a
          class="text-sm font-medium text-gray-800 hover:no-underline"
          sveltekit:prefetch
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

  @screen sm {
    .post-list {
      grid-template-columns: repeat(auto-fill, 275px);
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
