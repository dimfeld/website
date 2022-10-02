<script lang="ts">
  import type { LayoutData } from './$types';
  import JournalNav from './JournalNav.svelte';

  export let data: LayoutData;
</script>

<div class="flex flex-col-reverse px-2 sm:flex-row sm:justify-center sm:gap-4">
  <JournalNav counts={data.counts} />
  <main>
    <slot />
  </main>
</div>
