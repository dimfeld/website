<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let epistemic_effort = undefined;
  export let epistemic_status = undefined;


  import * as labels from '../../postMeta.ts';
  import { getContext } from 'svelte';
  getContext('title').set(title);

  let statusObj = labels.statuses.find((l) => l.id === epistemic_status);
  let status = statusObj ? statusObj.long : epistemic_status;
</script>

<article class="mt-4">
  <div class="mb-4 leading-tight">
    <h2 class="text-2xl">{title}</h2>

    {#if status || epistemic_effort}
      <ul class="leading-tight">
        {#if status}<li>Epistemic Status: {status}</li>{/if}
        {#if epistemic_effort}<li>Epistemic Effort: {epistemic_effort}</li>{/if}
      </ul>
    {/if}

    <div>
      {#if date}Written <time>{date.slice(0, 10)}</time>{/if}
      {#if updated}&mdash; Updated <time>{updated.slice(0, 10)}</time>{/if}
    </div>
  </div>

  <slot />
</article>
