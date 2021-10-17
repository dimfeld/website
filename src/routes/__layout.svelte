<script>
  import '../app.css';
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Nav from './_Nav.svelte';
  export let segment;

  const titleStore = writable('');
  setContext('title', titleStore);

  $: title = $titleStore ? `${$titleStore} - Daniel Imfeld` : 'Daniel Imfeld';
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col min-h-screen">
  <Nav {segment} />
  <slot />
</div>
