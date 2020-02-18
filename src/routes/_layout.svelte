<script>
  import capitalize from "lodash/capitalize";
  export let segment;
  const links = ["about", "writing", "work"];
</script>

<style>
  #navbar > * {
    @apply align-middle;
  }

  a {
    @apply transition-all duration-200 ease-out;
  }
</style>

<div id="navbar" class="h-12 inset-x-0 border-b border-green-800 p-2 text-xl">
  <a class="text-gray-700 hover:text-blue-900 mr-8 h-full" href="/">
    Daniel Imfeld
  </a>
  {#each links as link (link)}
    <a
      class:font-medium={segment !== link}
      class:font-semibold={segment === link}
      class:text-black={segment === link}
      class:text-blue-900={segment !== link}
      class="mx-4 align-middle hover:text-black h-full"
      href={link}>
      {capitalize(link)}
    </a>
  {/each}
</div>

<slot />
