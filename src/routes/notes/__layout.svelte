<script context="module">
  import sorter from 'sorters';
  import map from 'just-map-values';
  import capitalize from 'just-capitalize';

  export async function load({ fetch }) {
    let [{ notes }, tags] = await Promise.all([
      fetch('/notes/list.json').then((r) => r.json()),
      fetch('/notes/tags.json').then((r) => r.json()),
    ]);

    return { props: { notes, tags } };
  }
</script>

<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import { page } from '$app/stores';
  import TagList from './_TagList.svelte';
  import Popup from '../../Popup.svelte';
  import SearchResultsPopup from './_SearchResultsPopup.svelte';
  import { filterText } from './_filters.ts';
  import { browser } from '$app/env';

  export let segment;
  export let tags;
  export let notes;

  let noteLookup = {};
  for (let note of notes) {
    noteLookup[note.id] = note;
  }

  $: currentNoteId = $page.url.pathname.slice('/notes/'.length);
  $: currentNote = noteLookup[currentNoteId];

  let activeTag = writable(browser ? $page.url.searchParams.get('tag') : '');
  let searchStore = writable('');
  setContext('activeTag', activeTag);
  setContext('search', searchStore);
  setContext('noteList', notes);
  setContext('noteLookup', noteLookup);
  setContext('tags', tags);

  let tagList = Object.entries(tags)
    .map(([key, val]) => {
      let label = key.replace(/-/g, ' ');
      return { id: key, label, ...val };
    })
    .sort(sorter('id'));
  setContext('tagList', tagList);

  const FILTER_TAGS = 'tags';
  const FILTER_SEARCH = 'search';
  let activeFilterBox = null;

  function handleTagChange({ detail: tag }) {
    $activeTag = tag || null;
    if (activeFilterBox === FILTER_TAGS) {
      closeTagsPopup();
    }
  }

  function toggleMobileTagList() {
    if (activeFilterBox === FILTER_TAGS) {
      closeTagsPopup();
    } else {
      activeFilterBox = FILTER_TAGS;
    }
  }

  function handleSearchBox({ target }) {
    $searchStore = (target.value || '').trim();
    if ($searchStore) {
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

  $: indexPage = !segment;

  let searchPopupNotes = [];
  $: {
    // Show the search results popup if we're not on the main page. If on the main
    // page then the PostList is the search results.
    if (!indexPage && activeFilterBox === FILTER_SEARCH && $searchStore) {
      searchPopupNotes = orderBy(filterText(notes, $searchStore), 'title');
    } else {
      searchPopupNotes = null;
    }
  }

  let mobileTagsButton;
  let mobileSearchBox;
  let largeSearchBox;
</script>

<div class="flex flex-col sm:flex-row">
  <!-- Small Screen filters -->
  <div class="sm:hidden">
    <div class="m-2 flex flex-row text-lg">
      <div class="flex-grow">
        <label for="mobile-search" class="sr-only">Search</label>
        <div class="relative rounded-md shadow-sm">
          <input
            id="mobile-search"
            on:input={handleSearchBox}
            on:focus={handleSearchBoxFocus}
            bind:this={mobileSearchBox}
            type="search"
            class="form-input block w-full sm:text-sm sm:leading-5"
            placeholder="Search..." />
        </div>
      </div>

      <button
        bind:this={mobileTagsButton}
        on:click={toggleMobileTagList}
        class="ml-2 inline-flex flex-shrink justify-start justify-center
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
      <TagList currentPost={currentNote} on:change={handleTagChange} />
    </Popup>

    <Popup
      visible={Boolean(searchPopupNotes)}
      triggerElement={mobileSearchBox}
      on:close={closeSearchPopup}
      on:click={closeSearchPopup}
      containerClass="w-full px-2"
      style="max-height:60vh"
      class="overflow-y-auto">
      <SearchResultsPopup
        on:click={closeSearchPopup}
        base="notes"
        posts={searchPopupNotes} />
    </Popup>
  </div>

  <!-- Large screen filters -->
  <div class="m-4 hidden w-48 flex-none sm:block">
    <label for="large-search" class="sr-only">Search</label>
    <div class="relative mb-2 rounded-md shadow-sm" bind:this={largeSearchBox}>
      <input
        id="large-search"
        on:input={handleSearchBox}
        on:focus={handleSearchBoxFocus}
        type="search"
        class="form-input block w-full sm:text-sm sm:leading-5"
        placeholder="Search..." />

      <Popup
        visible={Boolean(searchPopupNotes)}
        triggerElement={largeSearchBox}
        on:close={closeSearchPopup}
        on:click={closeSearchPopup}
        style="max-height:75vh;width:400px"
        containerClass="top-0 left-48 ml-2"
        class="overflow-y-auto">
        <SearchResultsPopup
          on:click={closeSearchPopup}
          base="notes"
          posts={searchPopupNotes} />
      </Popup>
    </div>

    <TagList currentPost={currentNote} on:change={handleTagChange} />

    <div class="text-center text-sm">
      <a href="/rss/notes.xml">Notes RSS</a>
    </div>
  </div>

  <div class="min-w-0 flex-1 overflow-y-auto">
    <slot />
  </div>
</div>
