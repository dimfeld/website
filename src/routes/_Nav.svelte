<script>
  import capitalize from 'just-capitalize';
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import * as contact from '$lib/contact';
  const links = [
    {
      name: 'writing',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-news"><path class="primary" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm2 3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H7z"/><path class="secondary" d="M7 14h10a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1zm7-8h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2zm0 4h3a1 1 0 0 1 0 2h-3a1 1 0 0 1 0-2z"/></svg>`,
    },
    {
      name: 'journals',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-light"><path class="primary" d="M5 8a7 7 0 1 1 10.62 6l-.64 3.2a1 1 0 0 1-.98.8h-4a1 1 0 0 1-.98-.8L8.38 14A7 7 0 0 1 5 8zm12 0a5 5 0 0 0-5-5 1 1 0 0 0 0 2 3 3 0 0 1 3 3 1 1 0 0 0 2 0z"/><path class="secondary" d="M15 21a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2 1 1 0 0 1 0-2h6a1 1 0 0 1 0 2z"/></svg>`,
    },
    {
      name: 'notes',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-document-notes"><path class="primary" d="M6 2h6v6c0 1.1.9 2 2 2h6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4c0-1.1.9-2 2-2zm2 11a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2H8zm0 4a1 1 0 0 0 0 2h4a1 1 0 0 0 0-2H8z"/><polygon class="secondary" points="14 2 20 8 14 8"/></svg>`,
    },
    {
      name: 'projects',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="icon-puzzle"><path class="primary" d="M6 11V8c0-1.1.9-2 2-2h3a1 1 0 0 0 1-1V4a2 2 0 1 1 4 0v1a1 1 0 0 0 1 1h3a2 2 0 0 1 2 2v3a1 1 0 0 1-1 1h-1a2 2 0 1 0 0 4h1a1 1 0 0 1 1 1v3a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-1a2 2 0 1 0-4 0v1a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1H4a2 2 0 1 1 0-4h1a1 1 0 0 0 1-1z"/><path class="secondary" d="M22 17v3a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-1a2 2 0 1 0-4 0v1a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2v-3a1 1 0 0 0-1-1H4a2 2 0 1 1 0-4h1a1 1 0 0 0 1-1v-.6c.54-.24 1.18-.4 1.97-.4 4 0 4 4 8.02 4 .84 0 1.5-.18 2.06-.45A2 2 0 0 0 20 16h1a1 1 0 0 1 1 1z"/></svg>',
    },
  ];

  $: segment = $page.url.pathname.split('/')[1];
  $: linkIndex = links.findIndex((l) => l.name === segment);
  $: currentLink = links[linkIndex];

  const nameWidth = 226;
  let backgroundHighlightStyle = '';
  $: {
    // The size of the first element + the size of each element + the extra skew offset
    let width;
    let left;
    if (linkIndex === -1) {
      left = -8;
      width = nameWidth + left;
    } else {
      left = nameWidth + linkIndex * 100;
      width = 100;
    }

    backgroundHighlightStyle = `width:${width}px;left:${left}px`;
  }

  let displayNav = false;
</script>

<nav
  id="navbar"
  class="flex w-full flex-row items-stretch bg-teal-900 text-lg shadow-sm
  shadow-inner"
  style="height:40px">
  <div class="hidden w-full flex-row sm:flex">
    <div
      class="bg-highlight absolute top-0 left-0 h-full bg-teal-700
      transition-transform duration-1000 ease-out"
      style={backgroundHighlightStyle} />
    <a
      data-sveltekit-preload-data
      class="section-link root-link hover:text-teal-200"
      class:current-link={!segment}
      style="width:{nameWidth}px;padding-left:24px;padding-right:32px"
      href="/">
      <span class="whitespace-nowrap">Daniel Imfeld</span>
    </a>
    {#each links as { name, icon } (name)}
      <a
        data-sveltekit-preload-data
        class:current-link={segment === name}
        class="section-link justify-center"
        style="width:100px"
        href="/{name}">
        {capitalize(name)}
      </a>
    {/each}

    <div class="ml-auto mr-4 flex h-full flex-row items-center text-teal-200">
      <a
        class="p-2 hover:bg-teal-800"
        rel="me"
        href={contact.mastodon}
        aria-label="My Mastodon Account"
        title="Mastodon">
        <svg
          width="16"
          height="16"
          viewBox="0 0 74 79"
          xmlns="http://www.w3.org/2000/svg">
          <path
            class="primary"
            d="M73.7014 17.4323C72.5616 9.05152 65.1774 2.4469 56.424 1.1671C54.9472 0.950843 49.3518 0.163818 36.3901 0.163818H36.2933C23.3281 0.163818 20.5465 0.950843 19.0697 1.1671C10.56 2.41145 2.78877 8.34604 0.903306 16.826C-0.00357854 21.0022 -0.100361 25.6322 0.068112 29.8793C0.308275 35.9699 0.354874 42.0498 0.91406 48.1156C1.30064 52.1448 1.97502 56.1419 2.93215 60.0769C4.72441 67.3445 11.9795 73.3925 19.0876 75.86C26.6979 78.4332 34.8821 78.8603 42.724 77.0937C43.5866 76.8952 44.4398 76.6647 45.2833 76.4024C47.1867 75.8033 49.4199 75.1332 51.0616 73.9562C51.0841 73.9397 51.1026 73.9184 51.1156 73.8938C51.1286 73.8693 51.1359 73.8421 51.1368 73.8144V67.9366C51.1364 67.9107 51.1302 67.8852 51.1186 67.862C51.1069 67.8388 51.0902 67.8184 51.0695 67.8025C51.0489 67.7865 51.0249 67.7753 50.9994 67.7696C50.9738 67.764 50.9473 67.7641 50.9218 67.7699C45.8976 68.9569 40.7491 69.5519 35.5836 69.5425C26.694 69.5425 24.3031 65.3699 23.6184 63.6327C23.0681 62.1314 22.7186 60.5654 22.5789 58.9744C22.5775 58.9477 22.5825 58.921 22.5934 58.8965C22.6043 58.8721 22.621 58.8505 22.6419 58.8336C22.6629 58.8167 22.6876 58.8049 22.714 58.7992C22.7404 58.7934 22.7678 58.794 22.794 58.8007C27.7345 59.9796 32.799 60.5746 37.8813 60.5733C39.1036 60.5733 40.3223 60.5733 41.5447 60.5414C46.6562 60.3996 52.0437 60.1408 57.0728 59.1694C57.1983 59.1446 57.3237 59.1233 57.4313 59.0914C65.3638 57.5847 72.9128 52.8555 73.6799 40.8799C73.7086 40.4084 73.7803 35.9415 73.7803 35.4523C73.7839 33.7896 74.3216 23.6576 73.7014 17.4323ZM61.4925 47.3144H53.1514V27.107C53.1514 22.8528 51.3591 20.6832 47.7136 20.6832C43.7061 20.6832 41.6988 23.2499 41.6988 28.3194V39.3803H33.4078V28.3194C33.4078 23.2499 31.3969 20.6832 27.3894 20.6832C23.7654 20.6832 21.9552 22.8528 21.9516 27.107V47.3144H13.6176V26.4937C13.6176 22.2395 14.7157 18.8598 16.9118 16.3545C19.1772 13.8552 22.1488 12.5719 25.8373 12.5719C30.1064 12.5719 33.3325 14.1955 35.4832 17.4394L37.5587 20.8853L39.6377 17.4394C41.7884 14.1955 45.0145 12.5719 49.2765 12.5719C52.9614 12.5719 55.9329 13.8552 58.2055 16.3545C60.4017 18.8574 61.4997 22.2371 61.4997 26.4937L61.4925 47.3144Z" />
        </svg>
      </a>
      <a
        class="ml-2 p-2 hover:bg-teal-800"
        href="https://www.twitter.com/dimfeld"
        aria-label="My Twitter Feed"
        title="Twitter">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24">
          <path
            class="primary"
            d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574
            2.165-2.724-.951.564-2.005.974-3.127
            1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797
            6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108
            1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415
            3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6
            3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548
            2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562
            2.457-2.549z" />
        </svg>
      </a>
      <a
        class="ml-2 p-2 hover:bg-teal-800"
        rel="alternate"
        aria-label="RSS Feed"
        title="RSS Feed"
        type="application/rss+xml"
        href="/rss/all.xml">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24">
          <path
            class="primary"
            d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796
            0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001
            3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966
            11.022
            11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046
            19.152 8.594 19.183
            19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
        </svg>
      </a>
    </div>
  </div>

  <div
    id="vert-navbar"
    class="z-20 flex w-full flex-row items-center sm:hidden"
    on:click={() => (displayNav = false)}>
    <div
      class="bg-highlight absolute top-0 h-full bg-teal-700"
      style="left:-8px;width:218px" />
    <a
      class="text-white"
      style="padding-left:24px"
      href="/{currentLink?.name || ''}">
      {currentLink ? capitalize(currentLink.name) : 'Daniel Imfeld'}
    </a>

    <span
      class="ml-auto mr-2 h-12 w-12 cursor-pointer"
      on:click|stopPropagation={() => (displayNav = !displayNav)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path
          class="primary"
          fill-rule="evenodd"
          d="M15.3 10.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1
          1.4-1.4l3.3 3.29 3.3-3.3z" />
      </svg>
    </span>

    {#if displayNav}
      <div
        class="absolute inset-x-0 z-40"
        style="top:40px"
        transition:fade={{ duration: 200 }}>
        <div
          on:click|stopPropagation={() => {}}
          class="flex w-full flex-row border-t border-teal-700 bg-teal-900 pb-2
          shadow-md">
          <div class="flex flex-grow flex-col">
            <a
              data-sveltekit-preload-data
              class:current-link={!segment}
              class="section-link w-full justify-start py-2 pl-4 font-medium
              hover:bg-teal-800"
              on:click={() => (displayNav = false)}
              href="/">
              <span class="h-8 w-8">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  class="icon-home">
                  <path
                    class="primary"
                    d="M9 22H5a1 1 0 0 1-1-1V11l8-8 8 8v10a1 1 0 0 1-1 1h-4a1 1
                    0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1
                    1zm3-9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                  <path
                    class="secondary"
                    d="M12.01 4.42l-8.3 8.3a1 1 0 1 1-1.42-1.41l9.02-9.02a1 1 0
                    0 1 1.41 0l8.99 9.02a1 1 0 0 1-1.42 1.41l-8.28-8.3z" />
                </svg>
              </span>
              <span class="ml-2">Home</span>
            </a>
            {#each links as { name, icon }}
              <a
                data-sveltekit-preload-data
                class:current-link={segment === name}
                class="section-link w-full justify-start py-2 pl-4 font-medium
                hover:bg-teal-800"
                on:click={() => (displayNav = false)}
                href="/{name}">
                <span class="h-8 w-8">
                  {@html icon}
                </span>
                <span class="ml-2">{capitalize(name)}</span>
              </a>
            {/each}
          </div>

          <div class="flex flex-col justify-end pt-2 pb-1 pr-2 text-teal-200">
            <a
              class="flex-none p-2 hover:bg-teal-800"
              rel="me"
              href={contact.mastodon}
              aria-label="My Mastodon Account"
              title="Mastodon">
              <svg
                width="16"
                height="16"
                viewBox="0 0 74 79"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  class="primary"
                  d="M73.7014 17.4323C72.5616 9.05152 65.1774 2.4469 56.424 1.1671C54.9472 0.950843 49.3518 0.163818 36.3901 0.163818H36.2933C23.3281 0.163818 20.5465 0.950843 19.0697 1.1671C10.56 2.41145 2.78877 8.34604 0.903306 16.826C-0.00357854 21.0022 -0.100361 25.6322 0.068112 29.8793C0.308275 35.9699 0.354874 42.0498 0.91406 48.1156C1.30064 52.1448 1.97502 56.1419 2.93215 60.0769C4.72441 67.3445 11.9795 73.3925 19.0876 75.86C26.6979 78.4332 34.8821 78.8603 42.724 77.0937C43.5866 76.8952 44.4398 76.6647 45.2833 76.4024C47.1867 75.8033 49.4199 75.1332 51.0616 73.9562C51.0841 73.9397 51.1026 73.9184 51.1156 73.8938C51.1286 73.8693 51.1359 73.8421 51.1368 73.8144V67.9366C51.1364 67.9107 51.1302 67.8852 51.1186 67.862C51.1069 67.8388 51.0902 67.8184 51.0695 67.8025C51.0489 67.7865 51.0249 67.7753 50.9994 67.7696C50.9738 67.764 50.9473 67.7641 50.9218 67.7699C45.8976 68.9569 40.7491 69.5519 35.5836 69.5425C26.694 69.5425 24.3031 65.3699 23.6184 63.6327C23.0681 62.1314 22.7186 60.5654 22.5789 58.9744C22.5775 58.9477 22.5825 58.921 22.5934 58.8965C22.6043 58.8721 22.621 58.8505 22.6419 58.8336C22.6629 58.8167 22.6876 58.8049 22.714 58.7992C22.7404 58.7934 22.7678 58.794 22.794 58.8007C27.7345 59.9796 32.799 60.5746 37.8813 60.5733C39.1036 60.5733 40.3223 60.5733 41.5447 60.5414C46.6562 60.3996 52.0437 60.1408 57.0728 59.1694C57.1983 59.1446 57.3237 59.1233 57.4313 59.0914C65.3638 57.5847 72.9128 52.8555 73.6799 40.8799C73.7086 40.4084 73.7803 35.9415 73.7803 35.4523C73.7839 33.7896 74.3216 23.6576 73.7014 17.4323ZM61.4925 47.3144H53.1514V27.107C53.1514 22.8528 51.3591 20.6832 47.7136 20.6832C43.7061 20.6832 41.6988 23.2499 41.6988 28.3194V39.3803H33.4078V28.3194C33.4078 23.2499 31.3969 20.6832 27.3894 20.6832C23.7654 20.6832 21.9552 22.8528 21.9516 27.107V47.3144H13.6176V26.4937C13.6176 22.2395 14.7157 18.8598 16.9118 16.3545C19.1772 13.8552 22.1488 12.5719 25.8373 12.5719C30.1064 12.5719 33.3325 14.1955 35.4832 17.4394L37.5587 20.8853L39.6377 17.4394C41.7884 14.1955 45.0145 12.5719 49.2765 12.5719C52.9614 12.5719 55.9329 13.8552 58.2055 16.3545C60.4017 18.8574 61.4997 22.2371 61.4997 26.4937L61.4925 47.3144Z" />
              </svg>
            </a>
            <a
              aria-label="Twitter"
              title="Twitter Feed"
              class="flex-none p-2 hover:bg-teal-800"
              href="https://www.twitter.com/dimfeld">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24">
                <path
                  class="primary"
                  d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609
                  1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127
                  1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515
                  2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29
                  2.213-.669 5.108 1.523
                  6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415
                  3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379
                  4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768
                  2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695
                  1.797-1.562 2.457-2.549z" />
              </svg>
            </a>
            <a
              class="p-2 hover:bg-teal-800"
              rel="alternate"
              aria-label="RSS Feed"
              title="RSS Feed"
              type="application/rss+xml"
              href="/rss/all.xml">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24">
                <path
                  class="primary"
                  d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796
                  0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248
                  1.795.001 3.251 1.454 3.251
                  3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022
                  11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046
                  19.152 8.594 19.183
                  19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div
        class="fixed inset-0 z-30"
        style="background-color:rgba(0, 0, 0, 0.3);"
        on:click={() => (displayNav = false)}
        transition:fade={{ duration: 200 }} />
    {/if}
  </div>
</nav>

<style lang="postcss">
  a {
    @apply flex flex-row items-center transition-colors ease-in-out;
  }

  a.section-link:not(.root-link) {
    @apply font-medium;
  }

  a.section-link.current-link {
    @apply text-white;
  }

  a.section-link:not(.current-link) {
    @apply text-teal-100;
  }

  a.section-link:not(.current-link):hover {
    @apply text-teal-200;
  }

  a {
    text-decoration: inherit;
  }

  .bg-highlight {
    transition-property: left, width;
    transform: skewX(-20deg);
  }
</style>
