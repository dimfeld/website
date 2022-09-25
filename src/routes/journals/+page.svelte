<script lang="ts">
  import Journal from '$lib/Journal.svelte';
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<div class="mt-2 flex flex-col gap-8">
  {#each data.journals as post}
    <Journal {...post} />
  {/each}
</div>
