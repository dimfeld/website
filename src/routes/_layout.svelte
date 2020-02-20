<script>
  import Nav from './_Nav.svelte';
  export let segment;
</script>

<div class="flex flex-row flex-col">
  <Nav {segment} />
  <slot />
</div>
