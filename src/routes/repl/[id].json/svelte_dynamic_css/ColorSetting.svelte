<script>
  import * as styleManager from './styleManager';

  export let key;
  export let value;
  export let label;

  $: styleManager.set(key, value);
</script>

<label>
  <input style="padding:0" type="color" bind:value />
  {label}
</label>
