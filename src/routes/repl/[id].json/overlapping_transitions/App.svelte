<script>
  /* This is an example of using CSS Grid to make transitions work when two elements
	 	should be in the same place. Ping me at @dimfeld on Twitter with any questions! */
  import { fly } from 'svelte/transition';
  import { onMount } from 'svelte';

  let enabled = false;
  onMount(() => {
    let timer = setInterval(() => (enabled = !enabled), 2000);
    return () => clearInterval(timer);
  });
</script>

<section>
  <h1>Separate elements</h1>
  <div class="transition-container">
    {#if enabled}
      <h3 transition:fly|global={{ x: -200 }}>Enabled!</h3>
    {:else}
      <h3 transition:fly|global={{ x: 200 }}>Disabled!</h3>
    {/if}
  </div>
</section>

<section>
  <h1>Using #key with a single element</h1>
  <div class="transition-container">
    <!-- This also works -->
    {#key enabled}
      <h3 in:fly|global={{ x: -200 }} out:fly|global={{ x: 200 }}>
        {#if enabled}
          Enabled!
        {:else}
          Disabled!
        {/if}
      </h3>
    {/key}
  </div>
</section>

<section style="margin-top:4rem">
  <h1>Layout jumps without forced overlap</h1>

  {#key enabled}
    <h3 transition:fly|global={{ x: -200 }}>
      {#if enabled}
        Enabled!
      {:else}
        Disabled!
      {/if}
    </h3>
  {/key}
</section>

<style>
  .transition-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  .transition-container > * {
    grid-row: 1;
    grid-column: 1;
  }

  h3 {
    text-align: center;
  }
  section {
    border-bottom: solid 1px #222;
    overflow-x: hidden;
  }
</style>
