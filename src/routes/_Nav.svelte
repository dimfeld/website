<script>
  import capitalize from 'lodash/capitalize';
  export let segment;
  const links = ['about', 'writing', 'work'];

  $: linkIndex = links.indexOf(segment);

  let backgroundHighlightStyle = '';
  $: {
    // The size of the first element + the size of each element + the extra skew offset
    let width;
    let left;
    if (linkIndex === -1) {
      left = -8;
      width = 226 + left;
    } else {
      left = 226 + linkIndex * 120;
      width = 120;
    }

    backgroundHighlightStyle = `width:${width}px;left:${left}px`;
  }
</script>

<style lang="postcss">
  a {
    @apply h-full transition-colors duration-500 ease-in-out flex flex-row items-center;
  }

  a.section-link {
    @apply justify-center font-medium;
  }

  a.section-link.current-link {
    @apply text-white;
  }

  a.section-link:not(.current-link) {
    @apply text-teal-200;
  }

  a.section-link:not(.current-link):hover {
    @apply text-teal-500;
  }

  #bg-highlight {
    transition-property: left, width;
    transform: skewX(-20deg);
  }
</style>

<div
  id="navbar"
  class="flex flex-row items-stretch inset-x-0 text-xl shadow-sm shadow-inner
  bg-teal-900"
  style="height:48px">
  <div
    id="bg-highlight"
    class="absolute h-full bg-teal-700 duration-1000 ease-out
    transition-transform top-0 left-0"
    style={backgroundHighlightStyle} />
  <a
    class="text-teal-100 hover:text-teal-200"
    style="width:226px;padding-left:24px;padding-right:32px"
    href="/">
    <span>Daniel Imfeld</span>
  </a>
  {#each links as link (link)}
    <a
      class:current-link={segment === link}
      class="section-link"
      style="width:120px"
      href={link}>
      {capitalize(link)}
    </a>
  {/each}
</div>
