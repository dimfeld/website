<script>
  import { cardImageUrl } from '../postMeta';

  import capitalize from 'just-capitalize';
  import { flip } from 'svelte/animate';
  export let posts;
  export let base;
  export let useUpdatedDate = false;

  function tagLabels(tags) {
    return (tags || []).map((t) => capitalize(t.replace(/_/g, ' '))).join(', ');
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
  class="post-list w-full flex flex-col items-stretch sm:grid sm:gap-8
  xl:col-gap-12 sm:mt-4"
  style=";"
>
  {#each posts as post (post.id)}
    <div
      animate:flip={{ duration: 300 }}
      class="sm:rounded-sm border-b sm:border border-teal-100 sm:border-teal-100
      p-2 sm:shadow-md flex-1 flex flex-col"
    >
      {#if post.cardImage}
        <div class="post-bg" style={backgroundImage(post)} />
      {/if}
      <a sapper:prefetch href="{base}/{post.id}" class="text-lg text-teal-900">
        {post.title}
      </a>
      <a
        class="hover:no-underline text-gray-800 font-medium text-sm"
        sapper:prefetch
        href="{base}/{post.id}">
        <p>{post.summary || ''}</p>
      </a>
      <p class="flex flex-row text-sm mt-auto pt-2">
        <span>{tagLabels(post.tags)}</span>
        {#if post.date}
          <time class="ml-auto">
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
    @apply absolute left-0 top-0 block w-full h-full;
    z-index: -1;
    background-repeat: no-repeat;
    background-position-y: center;
    background-size: 100%;
    opacity: 0.2;
    filter: var(--post-bg-filter, brightness(155%) saturate(200%));
  }

  @screen sm {
    .post-list {
      grid-template-columns: repeat(2, 275px);
      @apply justify-center;
    }
  }

  @screen lg {
    .post-list {
      grid-template-columns: repeat(3, 275px);
    }
  }

  @screen xl {
    .post-list {
      grid-template-columns: repeat(3, 325px);
    }
  }
</style>
