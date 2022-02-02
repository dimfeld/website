<script lang="ts">
  import ky from 'ky';
  import clone from 'just-clone';
  import { onMount, onDestroy, tick } from 'svelte';
  import LazyLoad from '@dimfeld/svelte-lazyload';

  export let height = '800px';
  export let data = undefined;
  export let id = undefined;
  export let expandedWidth = true;
  export let lazy = true;

  $: hasExternalLink = /^[a-z0-9]{32}$/.test(id);

  if (typeof expandedWidth === 'string') {
    expandedWidth = expandedWidth === 'true';
  }

  let container;
  let repl;
  let windowWidth;
  let loading = true;

  interface ReplResult {
    components: {
      name: string;
      type: string;
      source: string;
    }[];
    id: string;
    name: string;
  }

  async function downloadReplData() {
    if (id && !data) {
      let result = await ky(`/repl/${id}.json`).json<ReplResult>();

      return {
        title: result.name,
        components: result.components,
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
        svelteUrl: 'https://unpkg.com/svelte@3.35',
        workersUrl: '/workers',
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

<svelte:window bind:innerWidth={windowWidth} />

<div class:w-expanded-95={expandedWidth}>
  <div class="flex flex-col font-sans border border-gray-100 shadow-md rounded-lg">
    <div
      class="flex px-4 py-2 text-teal-800 border-b border-gray-200 items-start
      sm:items-stretch">
      {#if title}
        <span>{title}</span>
      {/if}
      <div class="ml-auto flex space-x-2">
        {#if hasExternalLink}
          <a
            class="inline-flex rounded-md shadow-sm hover:no-underline"
            href="https://svelte.dev/repl/{id}"
            target="_blank"
            rel="noopener">
            <button
              type="button"
              class="inline-flex items-center px-2.5 py-1.5 border border-gray-300
          text-xs leading-4 font-medium rounded text-gray-700 bg-white
          hover:text-gray-500 focus:outline-none focus:border-blue-300
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:text-gray-800 active:bg-gray-50
          transition ease-in-out duration-150">
              Fork this REPL
            </button>
          </a>
        {/if}
        <span class="ml-2 inline-flex rounded-md shadow-sm">
          <button
            type="button"
            class="inline-flex items-center px-2.5 py-1.5 border border-gray-300
          text-xs leading-4 font-medium rounded text-gray-700 bg-white
          hover:text-gray-500 focus:outline-none focus:border-blue-300
          focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:text-gray-800 active:bg-gray-50
          transition ease-in-out duration-150"
            on:click={reset}>
            Reset
          </button>
        </span>
      </div>
    </div>
    <LazyLoad {height} visible={!lazy} on:visible={createRepl}>
      {#if loading}
        <div>Loading REPL...</div>
      {/if}
      <div class="svelte-repl" style="height:{height};" bind:this={container} />
    </LazyLoad>
  </div>
</div>

<style>
  .svelte-repl {
    @apply bg-white leading-snug;
    --font: 'Inter', 'Open Sans', 'Helvetica', 'Verdana', sans-serif;
    --prime: rgb(3, 102, 114);
    --second: #676778;
    --back-light: #f6fafd;
    --font-mono: 'Inconsolata', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace;
  }
</style>
