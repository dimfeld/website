<script lang="ts">
  import { page } from '$app/stores';
  import TagList from './TagList.svelte';
  import Popup from '../Popup.svelte';
  import SearchResultsPopup from './SearchResultsPopup.svelte';
  import { browser } from '$app/environment';
  import { orderBy } from 'lodash-es';
  import type { PostInfo } from '$lib/readPosts';
  import { beforeNavigate } from '$app/navigation';
  import { filterText, searchContext } from './index.js';

  export let rss: { url: string; title: string };
  export let postType: string;
  export let baseUrl: string;

  const { activeTag, postList, postLookup, search } = searchContext();

  $: baseCompare = baseUrl + '/';
  $: currentPostId = $page.url.pathname.slice(baseCompare.length);
  $: currentPost = postLookup.get(currentPostId);

  $: $activeTag = browser ? $page.url.searchParams.get('tag') || '' : '';

  const FILTER_TAGS = 'tags';
  const FILTER_SEARCH = 'search';
  let activeFilterBox: 'tags' | 'search' | null = null;

  function toggleMobileTagList() {
    if (activeFilterBox === FILTER_TAGS) {
      closeTagsPopup();
    } else {
      activeFilterBox = FILTER_TAGS;
    }
  }

  let searchValue = $search;
  $: {
    $search = (searchValue || '').trim();
    if ($search) {
      activeFilterBox = FILTER_SEARCH;
    }
  }

  function handleSearchBoxFocus() {
    activeFilterBox = FILTER_SEARCH;
  }

  function closeTagsPopup() {
    if (activeFilterBox === FILTER_TAGS) {
      activeFilterBox = null;
    }
  }

  function closeSearchPopup() {
    if (activeFilterBox === FILTER_SEARCH) {
      activeFilterBox = null;
    }
  }

  let searchPopupPosts: PostInfo[] | null = [];
  $: {
    if ($search) {
      searchPopupPosts = orderBy(filterText(postList, $search), 'title');
    } else {
      searchPopupPosts = null;
    }
  }

  beforeNavigate(() => {
    activeFilterBox = null;
  });

  $: searchPopupVisible = Boolean(
    activeFilterBox === FILTER_SEARCH &&
      $page.params.path &&
      searchPopupPosts?.length
  );

  let mobileTagsButton;
  let mobileSearchBox;
  let largeSearchBox;
</script>

<!-- Small Screen filters -->
<div class="sm:hidden">
  <div class="m-2 flex flex-row text-lg">
    <div class="flex-grow">
      <label for="mobile-search" class="sr-only">Search</label>
      <div class="relative rounded-md shadow-sm">
        <input
          id="mobile-search"
          on:focus={handleSearchBoxFocus}
          bind:value={searchValue}
          bind:this={mobileSearchBox}
          type="search"
          class="form-input block w-full sm:text-sm sm:leading-5"
          placeholder="Search..." />
      </div>
    </div>

    <button
      bind:this={mobileTagsButton}
      on:click={toggleMobileTagList}
      class="ml-2 inline-flex flex-shrink justify-center
        rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium
        leading-5 text-gray-700 shadow-sm transition
        duration-150 ease-in-out hover:text-gray-500 focus:border-blue-300 focus:outline-none
        focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-gray-50
        active:text-gray-800">
      Tags
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="16"
        viewBox="0 0 24 24"
        class="-mr-1 ml-1 h-5 w-5">
        <path
          class="secondary"
          fill-rule="evenodd"
          d="M15.3 10.3a1 1 0 0 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1
            1.4-1.4l3.3 3.29 3.3-3.3z" />
      </svg>
    </button>
  </div>
  <Popup
    visible={activeFilterBox === FILTER_TAGS}
    on:close={closeTagsPopup}
    triggerElement={mobileTagsButton}
    containerClass="w-full px-2"
    class="overflow-y-auto"
    style="max-height:60vh">
    <TagList {baseUrl} {postType} {currentPost} on:change={closeTagsPopup} />
  </Popup>

  <Popup
    visible={searchPopupVisible}
    triggerElement={mobileSearchBox}
    on:close={closeSearchPopup}
    on:click={closeSearchPopup}
    containerClass="w-full px-2"
    style="max-height:60vh"
    class="overflow-y-auto">
    <SearchResultsPopup
      on:click={closeSearchPopup}
      {baseUrl}
      posts={searchPopupPosts} />
  </Popup>
</div>

<!-- Large screen filters -->
<div class="m-4 hidden w-48 flex-none sm:block">
  <label for="large-search" class="sr-only">Search</label>
  <div class="relative mb-2 rounded-md shadow-sm" bind:this={largeSearchBox}>
    <input
      id="large-search"
      bind:value={searchValue}
      on:focus={handleSearchBoxFocus}
      type="search"
      class="form-input block w-full sm:text-sm sm:leading-5"
      placeholder="Search..." />

    <Popup
      visible={searchPopupVisible}
      triggerElement={largeSearchBox}
      on:close={closeSearchPopup}
      on:click={closeSearchPopup}
      style="max-height:75vh;width:400px"
      containerClass="top-0 left-48 ml-2"
      class="overflow-y-auto">
      <SearchResultsPopup
        on:click={closeSearchPopup}
        {baseUrl}
        posts={searchPopupPosts} />
    </Popup>
  </div>

  <TagList {baseUrl} {postType} {currentPost} />

  <div class="text-center text-sm">
    <a href={rss.url}>{rss.title}</a>
  </div>
</div>
