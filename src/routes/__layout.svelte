<script>
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Nav from './_Nav.svelte';
  export let segment;

  const titleStore = writable('');
  setContext('title', titleStore);

  $: title = $titleStore ? `${$titleStore} - Daniel Imfeld` : 'Daniel Imfeld';

  if (import.meta.hot) {
    import.meta.hot.on('content-update', (data) => {
      invalidate('/writing/latest.json');
      if (data.type === 'notes') {
        invalidate('/notes/list.json');
        invalidate('/notes/tags.json');
        invalidate(`/notes/note/${data.id}.json`);
      } else if (data.type === 'writing') {
        invalidate('/writing/list.json');
        invalidate(`/writing/${data.id}.json`);
      }
    });
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col min-h-screen">
  <Nav {segment} />
  <slot />
</div>
