<script>
  import { onMount, tick } from 'svelte';
  import clone from 'just-clone';

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
  $: repl && repl.set(clone(replData));
  $: repl && updateOrientation(windowWidth);

  function reset() {
    repl.set(clone(replData));
  }
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
    <div
      class="flex px-4 py-2 text-teal-800 border-b border-gray-200 items-start
      sm:items-stretch">
      {#if title}
        <span>{title}</span>
      {/if}
      <span class="ml-auto inline-flex rounded-md shadow-sm">
        <button
          type="button"
          class="inline-flex items-center px-2.5 py-1.5 border border-gray-300
          text-xs leading-4 font-medium rounded text-gray-700 bg-white
          hover:text-gray-500 focus:outline-none focus:border-blue-300
          focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50
          transition ease-in-out duration-150"
          on:click={reset}>
          Reset
        </button>
      </span>
    </div>
    <div class="svelte-repl" style="height:{height};" bind:this={container} />
  </div>
</div>
