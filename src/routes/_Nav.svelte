<script>
  import capitalize from 'lodash/capitalize';
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  export let segment;
  const links = [
    {
      name: 'about',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-user"><path class="primary" d="M12 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/><path class="secondary" d="M21 20v-1a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v1c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2z"/></svg>`,
    },
    {
      name: 'writing',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-news"><path class="primary" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm2 3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7z"/><path class="secondary" d="M7 14h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm7-8h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2zm0 4h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2z"/></svg>`,
    },
    {
      name: 'work',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-factory"><path class="primary" d="M21 21H3a1 1 0 0 1-1-1.06l1-16A1 1 0 0 1 4 3h2a1 1 0 0 1 1 .94l.39 6.26 2.9-2.9A1 1 0 0 1 12 8v2.59l3.3-3.3A1 1 0 0 1 17 8v2.59l3.3-3.3A1 1 0 0 1 22 8v12a1 1 0 0 1-1 1z"/><path class="secondary" d="M7 13h3v2H7v-2zm5 0h3v2h-3v-2zm5 0h3v2h-3v-2zM7 17h3v2H7v-2zm5 0h3v2h-3v-2zm5 0h3v2h-3v-2z"/></svg>`,
    },
  ];

  $: linkIndex = links.findIndex((l) => l.name === segment);
  $: currentLink = links[linkIndex];

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

  let displayNav = false;
</script>

<style lang="postcss">
  a {
    @apply transition-colors duration-500 ease-in-out flex flex-row items-center;
  }

  a.section-link {
    @apply font-medium;
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

  #vert-navbar :global(.primary) {
    fill: #64d5ca;
  }

  #vert-navbar :global(.secondary) {
    fill: #348382;
  }
</style>

<div
  class="flex flex-row items-stretch inset-x-0 text-xl shadow-sm shadow-inner
  bg-teal-900"
  style="height:48px">
  <div id="horz-navbar" class="hidden sm:flex flex-row">
    <div
      id="bg-highlight"
      class="absolute h-full bg-teal-700 duration-1000 ease-out
      transition-transform top-0 left-0"
      style={backgroundHighlightStyle} />
    <a
      rel="prefetch"
      class="hover:text-teal-200"
      class:text-white={!segment}
      class:text-teal-100={segment}
      style="width:226px;padding-left:24px;padding-right:32px"
      href="/">
      <span class="whitespace-no-wrap">Daniel Imfeld</span>
    </a>
    {#each links as { name, icon } (name)}
      <a
        rel="prefetch"
        class:current-link={segment === name}
        class="section-link justify-center"
        style="width:120px"
        href={name}>
        {capitalize(name)}
      </a>
    {/each}
  </div>

  <div id="vert-navbar" class="w-full flex sm:hidden flex-row items-center">
    <div
      id="bg-highlight"
      class="absolute bg-teal-700 h-full top-0"
      style="left:-8px;width:218px" />
    <a
      class="text-white"
      style="padding-left:24px"
      href={currentLink ? currentLink.name : '/'}>
      {currentLink ? capitalize(currentLink.name) : 'Daniel Imfeld'}
    </a>

    <span
      class="ml-auto mr-2 cursor-pointer w-12 h-12"
      on:click={() => (displayNav = !displayNav)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="icon-cheveron-down">
        <path
          class="secondary"
          fill-rule="evenodd"
          d="M15.3 10.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1
          1.4-1.4l3.3 3.29 3.3-3.3z" />
      </svg>
    </span>

    {#if displayNav}
      <div
        class="absolute bg-teal-900 w-full z-30 flex flex-col pb-4 border-t
        border-teal-700 shadow-md"
        style="top:48px"
        transition:slide={{ duration: 200 }}>
        <a
          rel="prefetch"
          class:current-link={!segment}
          class="section-link justify-start font-medium pl-4 py-2 w-full
          hover:bg-teal-800"
          on:click={() => (displayNav = false)}
          href="/">
          <span class="w-8 h-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              class="icon-home">
              <path
                class="primary"
                d="M9 22H5a1 1 0 0 1-1-1V11l8-8 8 8v10a1 1 0 0 1-1 1h-4a1 1 0 0
                1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1zm3-9a2 2
                0 1 0 0-4 2 2 0 0 0 0 4z" />
              <path
                class="secondary"
                d="M12.01 4.42l-8.3 8.3a1 1 0 1 1-1.42-1.41l9.02-9.02a1 1 0 0 1
                1.41 0l8.99 9.02a1 1 0 0 1-1.42 1.41l-8.28-8.3z" />
            </svg>
          </span>
          <span class="ml-2">Home</span>
        </a>
        {#each links as { name, icon }}
          <a
            rel="prefetch"
            class:current-link={segment === name}
            class="section-link justify-start font-medium pl-4 py-2 w-full
            hover:bg-teal-800"
            on:click={() => (displayNav = false)}
            href={name}>
            <span class="w-8 h-8">
              {@html icon}
            </span>
            <span class="ml-2">{capitalize(name)}</span>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
