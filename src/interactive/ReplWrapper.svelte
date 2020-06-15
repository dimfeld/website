<script>
  import { onMount } from 'svelte';

  export let height = '400px';
  export let data;

  let container;
  let repl;
  onMount(async () => {
    let Repl = (await import('@sveltejs/svelte-repl')).default;
    repl = new Repl({
      target: container,
      props: {
        workersUrl: 'workers',
      },
    });
  });

  $: ({ title, ...replData } = data);
  $: repl && repl.set(replData);
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

<div
  class="flex flex-col w-full font-sans border border-gray-100 shadow-md
  rounded-lg">
  {#if title}
    <div class="px-4 py-2 text-teal-800 border-b border-gray-200">{title}</div>
  {/if}
  <div class="svelte-repl" style="height:{height};" bind:this={container} />
</div>
