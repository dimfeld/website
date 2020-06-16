<script>
  import { onMount, tick } from 'svelte';

  export let height = '800px';
  export let data;

  let container;
  let repl;
  let windowWidth;
  onMount(async () => {
    let Repl = (await import('@sveltejs/svelte-repl')).default;
    repl = new Repl({
      target: container,
      props: {
        workersUrl: 'workers',
        orientation: windowWidth > 600 ? 'columns' : 'rows',
      },
    });
  });

  async function updateOrientation(w) {
    // Occasionally the REPL gets a bit screwed up if we set orientation while it's still
    // intializing, so wait a tick.
    await tick();
    repl.$set({ orientation: w > 600 ? 'columns' : 'rows' });
  }

  $: ({ title, ...replData } = data);
  $: repl && repl.set(replData);
  $: repl && updateOrientation(windowWidth);
</script>

<style>
  .svelte-repl {
    --font: 'Inter', 'Open Sans', 'Helvetica', 'Verdana', sans-serif;
    --prime: rgb(3, 102, 114);
  }

  .svelte-repl :global(.CodeMirror) :global(pre) {
    @apply font-mono;
  }
</style>

<svelte:window bind:innerWidth={windowWidth} />
<div class="w-expanded-95">
  <div
    class="flex flex-col font-sans border border-gray-100 shadow-md rounded-lg">
    {#if title}
      <div class="px-4 py-2 text-teal-800 border-b border-gray-200">
        {title}
      </div>
    {/if}
    <div class="svelte-repl" style="height:{height};" bind:this={container} />
  </div>
</div>
