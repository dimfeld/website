<script lang="ts">
  import type { PageData } from './$types';
  import Journal from '$lib/Journal.svelte';

  export let data: PageData;
</script>

<div class="prose mt-2 flex w-full flex-col justify-center gap-8">
  {#each data.posts as journal}
    <Journal {...journal} />
  {:else}
    <span class="text-center font-medium text-2xl text-gray-700">
      No posts for this month!
    </span>
  {/each}
</div>
