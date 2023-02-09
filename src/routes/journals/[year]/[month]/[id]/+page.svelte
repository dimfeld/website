<script lang="ts">
  import Journal from '$lib/Journal.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<div class="pt-2">
  <Journal {...data.post} showFooter />
</div>
