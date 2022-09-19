<script>
  import { getContext, onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  getContext('title').set('About');

  let remaining = 5;
  let timer;
  onMount(() => {
    timer = setTimeout(doTimer, 1000);
  });

  onDestroy(() => {
    if (timer) {
      clearInterval(timer);
    }
  });

  function doTimer() {
    remaining -= 1;
    if (!remaining) {
      goto('/');
    } else {
      timer = setTimeout(doTimer, 1000);
    }
  }
</script>

<article class="font-serif my-2 px-4">
  I've moved all this content to the <a href="/">front page</a>. Redirecting in {remaining}...
</article>
