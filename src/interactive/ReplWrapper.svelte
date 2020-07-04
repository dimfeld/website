<script>
  import ky from 'ky';
  import clone from 'just-clone';
  import { onMount, onDestroy, tick } from 'svelte';
  import LazyLoad from '@dimfeld/svelte-lazyload';

  export let height = '800px';
  export let data;
  export let id = undefined;
  export let expandedWidth = true;
  export let lazy = true;

  if (typeof expandedWidth === 'string') {
    expandedWidth = expandedWidth === 'true';
  }

  let container;
  let repl;
  let windowWidth;
  let loading = true;

  async function downloadReplData() {
    console.log({ id, data });
    if (id && !data) {
      let result = await ky(`/api/repl/${id}`).json();
      let files = result.files.map((file) => {
        let filenameComponents = file.name.split('.');
        let name = filenameComponents.slice(0, -1);
        let type = filenameComponents[filenameComponents.length - 1];

        return {
          name,
          type,
          source: file.source,
        };
      });

      return {
        title: result.name,
        components: files,
      };
    }
  }

  async function createRepl() {
    let [Repl, replData] = await Promise.all([
      import('@sveltejs/svelte-repl').then((m) => m.default),
      downloadReplData(),
    ]);

    if (replData) {
      data = replData;
    }
    loading = false;

    repl = new Repl({
      target: container,
      props: {
        id,
        workersUrl: 'workers',
        orientation: windowWidth > 600 ? 'columns' : 'rows',
      },
    });
  }

  onDestroy(() => {
    if (repl) {
      repl.$destroy();
    }
  });

  async function updateOrientation(w) {
    // Occasionally the REPL gets a bit screwed up if we set orientation while it's still
    // intializing, so wait a tick.
    await tick();
    repl.$set({ orientation: w > 600 ? 'columns' : 'rows' });
  }

  $: ({ title, ...replData } = data || {});
  $: repl && repl.set(clone(replData));
  $: repl && updateOrientation(windowWidth);

  function reset() {
    repl.update(clone(replData));
  }
</script>

<style>
  .svelte-repl {
    @apply bg-white leading-snug;
    --font: 'Inter', 'Open Sans', 'Helvetica', 'Verdana', sans-serif;
    --prime: rgb(3, 102, 114);
    --second: #676778;
    --back-light: #f6fafd;
    --font-mono: 'Inconsolata', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono',
      'Courier New', monospace;
  }
</style>

<svelte:window bind:innerWidth={windowWidth} />

<div class:w-expanded-95={expandedWidth}>
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
    <LazyLoad {height} visible={!lazy} on:visible={createRepl}>
      {#if loading}
        <div>Loading REPL...</div>
      {/if}
      <div class="svelte-repl" style="height:{height};" bind:this={container} />
    </LazyLoad>
  </div>
</div>
