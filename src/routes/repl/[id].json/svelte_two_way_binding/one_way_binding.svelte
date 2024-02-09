<script>
  let value = 'Hello world!';
  let numWords = 2;

  function handleUpdate(e) {
    value = e.target.value;
    numWords = value.split(' ').filter(Boolean).length;
  }
</script>

<input type="text" {value} on:input={handleUpdate} />
<p>
  {numWords} words
</p>
