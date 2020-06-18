<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let confidence = undefined;
  export let devto = undefined;

  import * as labels from '../../postMeta.ts';
  import { getContext, onMount, onDestroy } from 'svelte';
  import instantiateComponents from '../../dynamicComponents';
  getContext('title').set(title);

  let destroyComponents;
  onMount(async () => {
    destroyComponents = await instantiateComponents();
  });

  onDestroy(() => {
    if (destroyComponents) {
      destroyComponents();
    }
  });
</script>

<article class="font-serif my-4 px-4 sm:px-0">
  <div class="mb-4 leading-tight">
    <h1 class="font-serif">{title}</h1>

    <div>
      {#if date}
        Written
        <time>{date.slice(0, 10)}</time>
      {/if}
      {#if updated}
        &mdash; Updated
        <time>{updated.slice(0, 10)}</time>
      {/if}
    </div>

    {#if confidence}
      <p class="p-4 bg-gray-100 border-gray-300 border">
        Confidence: {confidence}
      </p>
    {/if}
  </div>

  <div>
    <slot />
  </div>

  <hr />
  <p>
    Thanks for reading! If you have any comments, please
    {#if devto}
      <a href="https://www.twitter.com/dimfeld">send me a note on Twitter</a>
      or
      <a href="{devto.url}#comments">comment on dev.to.</a>
    {:else}
      <a href="https://www.twitter.com/dimfeld">send me a note on Twitter.</a>
    {/if}

  </p>
</article>
