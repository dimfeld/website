<script>
  export let base;
  export let posts;
</script>

{#each posts as result, index}
  <a
    class="block px-4 py-2 text-sm leading-5 text-gray-700 hover:bg-gray-100
    hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none"
    on:click
    href="/{base}/{result.id}">
    {result.title}
  </a>
{:else}
  <div class="block px-4 py-2 text-sm leading-5 text-gray-700">No results</div>
{/each}
