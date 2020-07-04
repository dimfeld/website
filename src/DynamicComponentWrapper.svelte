<script>
  export let component;
  export let componentProps;
</script>

<div>
  <svelte:component this={component} {...componentProps} />
</div>
