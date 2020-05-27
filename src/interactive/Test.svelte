<script>
  import { onDestroy } from 'svelte';

  export let initial;

  let counter = +initial;
  let timer = setInterval(() => (counter += 1), 1000);
  onDestroy(() => {
    clearTimeout(timer);
  });
</script>

<div>{counter}</div>
