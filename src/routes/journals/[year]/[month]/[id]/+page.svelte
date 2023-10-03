<script lang="ts">
  import { page } from '$app/stores';
  import Journal from '$lib/Journal.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<h1 class="sr-only">
  Journals for <time datetime={$page.params.id}>{$page.params.id}</time>
</h1>

<div class="prose pt-2">
  <Journal {...data.post} showFooter />
</div>
