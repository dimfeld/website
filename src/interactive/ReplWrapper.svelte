<script context="module">
  import clone from 'just-clone';

  let currentSet;
  let queuedSets = [];

  async function setRepl(repl, data, title) {
    if (currentSet) {
      console.log('queueing repl', title);
      queuedSets.push({ repl, data, title });
      return;
    }

    console.log('Setting repl', title);

    currentSet = repl.set(data);
    try {
      await currentSet;
      console.log(title, 'done');
    } catch (e) {
      console.error(e);
    }

    if (queuedSets.length) {
      setTimeout(() => {
        currentSet = null;
        let next = queuedSets.shift();
        setRepl(next.repl, next.data, next.title);
      });
    } else {
      currentSet = null;
    }
  }

  function clearSets(repl) {
    queuedSets = queuedSets.filter((item) => item.repl === repl);
  }
</script>

<script>
  import { onMount, onDestroy, tick } from 'svelte';

  export let height = '800px';
  export let data;
  export let expandedWidth = true;

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

  onDestroy(() => {
    if (repl) {
      clearSets(repl);
    }
  });

  async function updateOrientation(w) {
    // Occasionally the REPL gets a bit screwed up if we set orientation while it's still
    // intializing, so wait a tick.
    await tick();
    repl.$set({ orientation: w > 600 ? 'columns' : 'rows' });
  }

  $: ({ title, ...replData } = data);
  $: repl && setRepl(repl, clone(replData), title);
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
    <div class="svelte-repl" style="height:{height};" bind:this={container} />
  </div>
</div>
