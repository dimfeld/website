<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  export let count;

  function addValue(delta) {
    count += delta;
    dispatch('change', count);
  }
</script>

<div>
  <button on:click={() => addValue(-1)}> - </button>
  <button on:click={() => addValue(1)}> + </button>
</div>

<div style="width:100%;text-align:center;font-weight:600">
  {count}
</div>

<style>
  button {
    width: 2rem;
  }
</style>
