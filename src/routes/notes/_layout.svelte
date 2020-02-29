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

  export let segment;
  export let tags;
  export let notes;

  let noteLookup = {};
  for (let note of notes) {
    noteLookup[note.id] = note;
  }

  const { page } = stores();

  let initialPath = $page.path.slice('/notes/'.length);
  let initialNote = noteLookup[initialPath];

  let initialTags = initialNote
    ? initialNote.tags
    : [$page.query.tag].filter(Boolean);
  let activeTags = writable(initialTags);
  setContext('activeTags', activeTags);
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
    if (tag) {
      $activeTags = [tag];
    } else {
      $activeTags = [];
    }

    mobileTagListVisible = false;
  }

  async function clickOutside(node, { ignore, cb }) {
    var handleOutsideClick = ({ target }) => {
      if (!node.contains(target) && (!ignore || !ignore.contains(target))) {
        cb();
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return {
      destroy: () => window.removeEventListener('click', handleOutsideClick),
    };
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
            id="search"
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

    {#if mobileTagListVisible}
      <div
        use:clickOutside={{ ignore: tagsButton, cb: () => (mobileTagListVisible = false) }}
        transition:fade={{ duration: 200 }}
        style="max-height:75vh"
        class="absolute z-20 w-full overflow-y-auto px-2 pb-4">
        <div class="bg-white rounded-md shadow-lg">
          <TagList on:change={handleTagChange} />
        </div>
      </div>
    {/if}
  </div>

  <!-- Large screen tag list -->
  <div class="hidden sm:block m-4 w-48">
    <TagList on:change={handleTagChange} />
  </div>

  <div class="mt-4 flex-grow">
    <slot />
  </div>

</div>
