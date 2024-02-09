<script>
  let value = 'Hello world!';

  $: numWords = value.split(' ').filter(Boolean).length;
</script>

<input type="text" bind:value />
<p>
  {numWords} words
</p>
