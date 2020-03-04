<script context="module">
  import orderBy from 'lodash/orderBy';
  import map from 'lodash/map';
  import capitalize from 'lodash/capitalize';

  export async function preload() {
    let [notes, tags] = await Promise.all([
      this.fetch('/api/allNotes').then((r) => r.json()),
      this.fetch('/api/allTags').then((r) => r.json()),
    ]);

    return { notes, tags };
  }
</script>

<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { fade } from 'svelte/transition';
  import { stores } from '@sapper/app';
  import TagList from './_TagList.svelte';
  import Popup from '../../Popup.svelte';
  import SearchResultsPopup from './_SearchResultsPopup.svelte';
  import { filterText } from './_filters.ts';

  export let segment;
  export let tags;
  export let notes;

  let noteLookup = {};
  for (let note of notes) {
    noteLookup[note.id] = note;
  }

  const { page } = stores();

  $: currentNoteId = $page.path.slice('/notes/'.length);
  $: currentNote = noteLookup[currentNoteId];

  let activeTag = writable($page.query.tag);
  let searchStore = writable('');
  setContext('activeTag', activeTag);
  setContext('search', searchStore);
  setContext('noteList', notes);
  setContext('noteLookup', noteLookup);
  setContext('tags', tags);

  let tagData = map(tags, (val, key) => {
    let label = capitalize(key.replace(/_/g, ' '));
    return { id: key, label, ...val };
  });
  let tagList = orderBy(tagData, 'id');
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
    <div class="m-2 text-lg flex flex-row">

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
        class="ml-2 flex-shrink inline-flex justify-start justify-center
        rounded-md border border-gray-300 px-4 py-2 bg-white text-sm leading-5
        font-medium text-gray-700 hover:text-gray-500 focus:outline-none
        focus:border-blue-300 shadow-sm focus:shadow-outline-blue
        active:bg-gray-50 active:text-gray-800 transition ease-in-out
        duration-150">
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
  <div class="hidden sm:block m-4 w-48 flex-none">

    <label for="large-search" class="sr-only">Search</label>
    <div class="relative rounded-md shadow-sm mb-2" bind:this={largeSearchBox}>
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

    <div class="text-sm text-center">
      <a href="/rss/notes.xml">Notes RSS</a>
    </div>

  </div>

  <div class="flex-grow sm:ml-4">
    <slot />
  </div>

</div>
