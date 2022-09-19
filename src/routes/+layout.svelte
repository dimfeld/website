<script>
  import '../app.css';
  import { invalidate } from '$app/navigation';
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Nav from './_Nav.svelte';

  const titleStore = writable('');
  setContext('title', titleStore);

  $: title = $titleStore ? `${$titleStore} - Daniel Imfeld` : 'Daniel Imfeld';

  if (import.meta.hot) {
    import.meta.hot.on('content-update', (data) => {
      invalidate('/');
      if (data.type === 'notes') {
        invalidate('/notes');
        invalidate(`/notes/${data.id}`);
      } else if (data.type === 'writing') {
        invalidate('/writing');
        invalidate(`/writing/${data.id}`);
      }
    });
  }
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Nav />
  <slot />
</div>
