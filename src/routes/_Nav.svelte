<script>
  import capitalize from "lodash/capitalize";
  export let segment;
  const links = ["about", "writing", "work"];
</script>

<style lang="postcss">
  a {
    @apply align-middle h-full transition-colors duration-500 ease-out flex flex-row items-center;
  }

  a.section-link {
    @apply px-6 font-medium transform -skew-x-12;
  }

  a.section-link.current-link {
    @apply text-white bg-teal-700;
  }

  a.section-link > * {
    /* Unskew the outer element's skew, so that the text is upright */
    @apply transform skew-x-12;
  }

  a.section-link:not(.current-link) {
    @apply text-teal-200;
  }

  a.section-link:not(.current-link):hover {
    @apply text-teal-500;
  }
</style>

<div
  id="navbar"
  class="flex flex-row items-stretch h-12 inset-x-0 px-2 text-xl shadow-sm
  shadow-inner bg-teal-900">
  <a class="text-teal-100 hover:text-teal-200 ml-4 mr-8" href="/">
    Daniel Imfeld
  </a>
  {#each links as link (link)}
    <a class:current-link={segment === link} class="section-link" href={link}>
      <span>{capitalize(link)}</span>
    </a>
  {/each}
</div>
