<script>
  export let notes;
</script>

<div id="notelist">
  {#each notes as note (note.id)}
    <div>{note.id}</div>
  {/each}

</div>
