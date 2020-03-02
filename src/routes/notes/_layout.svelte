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

  let mobileTagListVisible = false;

  function handleTagChange({ detail: tag }) {
    $activeTag = tag || null;
    mobileTagListVisible = false;
  }

  function handleSearchBox({ target }) {
    $searchStore = (target.value || '').trim();
  }

  $: indexPage = !segment;

  let tagsButton;
</script>

<div class="flex flex-col sm:flex-row">
  <!-- Small Screen filters -->
  <div class="sm:hidden">
    <div class="m-2 text-lg flex flex-row">

      <div class="flex-grow">
        <label for="search" class="sr-only">Search</label>
        <div class="relative rounded-md shadow-sm">
          <input
            on:input={handleSearchBox}
            type="search"
            class="form-input block w-full sm:text-sm sm:leading-5"
            placeholder="Search..." />
        </div>
      </div>

      <button
        bind:this={tagsButton}
        on:click={() => (mobileTagListVisible = !mobileTagListVisible)}
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
      bind:visible={mobileTagListVisible}
      triggerElement={tagsButton}
      class="w-full px-2 overflow-y-auto"
      style="max-height:75vh">
      <TagList currentPost={currentNote} on:change={handleTagChange} />
    </Popup>
  </div>

  <!-- Large screen filters -->
  <div class="hidden sm:block m-4 w-48">

    <label for="search" class="sr-only">Search</label>
    <div class="relative rounded-md shadow-sm mb-2">
      <input
        on:input={handleSearchBox}
        type="search"
        class="form-input block w-full sm:text-sm sm:leading-5"
        placeholder="Search..." />
    </div>

    <TagList currentPost={currentNote} on:change={handleTagChange} />

    <div class="text-sm text-center">
      <a href="/rss/notes.xml">Notes RSS</a>
    </div>

  </div>

  <div class="flex-grow">
    <slot />
  </div>

</div>
