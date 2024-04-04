<script>
  /* This is an example of using CSS Grid to make transitions work when two elements
	 	should be in the same place. Ping me at @dimfeld on Twitter with any questions! */
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  let enabled = false;
  onMount(() => {
    let timer = setInterval(() => (enabled = !enabled), 3000);
    return () => clearInterval(timer);
  });
</script>

<aside class="overflow-hidden bg-gray-200 px-2 shadow-lg" style="height: 12rem">
  <div class="border-b border-gray-800">
    <h1>Layout jumps without forced overlap</h1>

    {#key enabled}
      <h3 class="text-center" transition:fly|global={{ x: -200, duration: 1000 }}>
        {#if enabled}Enabled!{:else}Disabled!{/if}
      </h3>
    {/key}
  </div>

  <p>More content that gets pushed down</p>
</aside>
