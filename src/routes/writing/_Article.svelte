<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let confidence = undefined;

  import * as labels from '../../postMeta.ts';
  import { getContext, onMount } from 'svelte';
  import instantiateComponents from '../../dynamicComponents';
  getContext('title').set(title);

  onMount(() => instantiateComponents());
</script>

<article class="font-serif my-4 px-4 sm:px-0">
  <div class="mb-4 leading-tight">
    <h2 class="text-2xl">{title}</h2>

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

  <slot />

  <hr />
  <p>
    Thanks for reading! If you have any comments, please
    <!-- prettier-ignore -->
    <a href="https://www.twitter.com/dimfeld">send me a note on Twitter.</a>
  </p>
</article>
