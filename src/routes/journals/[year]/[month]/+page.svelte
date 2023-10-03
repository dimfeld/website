<script lang="ts">
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import Journal from '$lib/Journal.svelte';

  export let data: PageData;
</script>

<h1 class="sr-only">
  Journals for <time datetime="{$page.params.year}-{$page.params.month}"
    >{$page.params.year}-{$page.params.month}</time>
</h1>
<div class="prose mt-2 flex w-full flex-col justify-center gap-8">
  {#each data.posts as journal}
    <Journal {...journal} />
  {:else}
    <span class="text-center font-medium text-2xl text-gray-700">
      No posts for this month!
    </span>
  {/each}
</div>
