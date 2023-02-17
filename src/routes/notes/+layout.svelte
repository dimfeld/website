<script lang="ts">
  import type { PageData } from './$types';
  import { createSearchContext } from '$lib/search/index.js';
  import Sidebar from '$lib/search/Sidebar.svelte';

  export let data: PageData;

  createSearchContext(data.notes, data.tags);
</script>

<div class="flex flex-col sm:flex-row">
  <Sidebar
    baseUrl="/notes"
    postType="Note"
    rss={{ title: 'Notes RSS', url: '/rss/notes.xml' }} />

  <div class="min-w-0 flex-1 overflow-y-auto">
    <slot />
  </div>
</div>
