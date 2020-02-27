<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let status = undefined;

  import * as labels from '../../postMeta.ts';
  import { getContext } from 'svelte';
  getContext('title').set(title);
</script>

<article class="mt-4">
  <div class="mb-4 leading-tight">
    <h2 class="text-2xl">{title}</h2>

    <div>
      {#if date}Written <time>{date.slice(0, 10)}</time>{/if}
      {#if updated}&mdash; Updated <time>{updated.slice(0, 10)}</time>{/if}
    </div>

    {#if status}<p>Status: {status}</p>{/if}
  </div>

  <slot />
</article>
