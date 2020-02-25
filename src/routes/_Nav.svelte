<script>
  import capitalize from 'lodash/capitalize';
  import { onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  export let segment;
  const links = [
    {
      name: 'writing',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-news"><path class="primary" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm2 3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7z"/><path class="secondary" d="M7 14h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm7-8h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2zm0 4h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2z"/></svg>`,
    },
    {
      name: 'about',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-user"><path class="primary" d="M12 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z"/><path class="secondary" d="M21 20v-1a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v1c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2z"/></svg>`,
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

  a {
    text-decoration: inherit;
  }

  #bg-highlight {
    transition-property: left, width;
    transform: skewX(-20deg);
  }

  #navbar :global(.primary) {
    fill: #b2f5ea;
  }

  #navbar :global(.secondary) {
    fill: #2c7a7b;
  }
</style>

<div
  id="navbar"
  class="flex flex-row items-stretch inset-x-0 text-xl shadow-sm shadow-inner
  bg-teal-900"
  style="height:48px">
  <div class="hidden sm:flex flex-row w-full">
    <div
      id="bg-highlight"
      class="absolute h-full bg-teal-700 duration-1000 ease-out
      transition-transform top-0 left-0"
      style={backgroundHighlightStyle}> </div>
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
        class:current-link="{segment === name}"
        class="section-link justify-center"
        style="width:120px"
        href={name} >
        {capitalize(name)}
      </a>
    {/each}

    <div class="h-full flex flex-row ml-auto mr-4 text-teal-200 items-center">
      <a class="p-2 hover:bg-teal-800" href="https://www.twitter.com/dimfeld" aria-label="My Twitter Feed" title="Twitter">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path class="primary" d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
      </a>
      <a class="ml-2 p-2 hover:bg-teal-800"
        rel="alternate"
        aria-label="RSS Feed"
        title="RSS Feed"
        type="application/rss+xml"
        href="/rss.xml">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path class="primary" d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/></svg>
      </a>
    </div>

  </div>

  <div id="vert-navbar" class="w-full flex sm:hidden flex-row items-center"
    on:click={() => displayNav = false}>
    <div
      id="bg-highlight"
      class="absolute bg-teal-700 h-full top-0"
      style="left:-8px;width:218px"> </div>
    <a
      class="text-white"
      style="padding-left:24px"
      href={currentLink ? currentLink.name : '/'}>
      {currentLink ? capitalize(currentLink.name) : 'Daniel Imfeld'}
    </a>

    <span
      class="ml-auto mr-2 cursor-pointer w-12 h-12"
      on:click|stopPropagation={() => (displayNav = !displayNav)}>
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
      <div class="fixed w-full h-full z-30"
        style="top:48px;bottom:0px;background-color:rgba(0, 0, 0, 0.3);"
        on:click={() => displayNav = false}
        in:fade={{ duration:100 }}
        >
        <div
          on:click|stopPropagation={() => {}}
          class="bg-teal-900 w-full flex flex-row pb-2 border-t
          border-teal-700 shadow-md"
          transition:slide={{ duration: 200 }}>
          <div class="flex flex-col flex-grow">
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

          <div class="pt-2 pb-1 pr-2 flex flex-col text-teal-200 justify-end">
            <a aria-label="Twitter" title="Twitter Feed" class="flex-none p-2 hover:bg-teal-800" href="https://www.twitter.com/dimfeld">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path class="primary" d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
            </a>
            <a class="p-2 hover:bg-teal-800"
              rel="alternate"
              aria-label="RSS Feed"
              title="RSS Feed"
              type="application/rss+xml"
              href="/rss.xml">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path class="primary" d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/></svg>
            </a>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
