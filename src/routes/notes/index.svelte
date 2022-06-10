<script context="module">
  export const prerender = true;
</script>

<script>
  import get from 'just-safe-get';
  import sorter from 'sorters';
  import { getContext } from 'svelte';
  import PostList from '../_PostList.svelte';
  import { filterText } from './_filters.ts';
  const notes = getContext('noteList');
  const noteLookup = getContext('noteLookup');
  const tags = getContext('tags');
  const activeTag = getContext('activeTag');
  const search = getContext('search');
  getContext('title').set('Notes');

  const sortField = 'date';
  let activeNotes = notes;
  $: {
    activeNotes = notes;
    if ($activeTag) {
      activeNotes = get(tags, [$activeTag, 'posts'], [])
        .map((id) => noteLookup[id])
        .sort(sorter({ value: sortField, descending: true }));
    }

    activeNotes = filterText(activeNotes, $search);
  }
</script>

<svelte:head>
  <meta name="Description" content="Notes by Daniel Imfeld" />
</svelte:head>

<PostList base="notes" posts={activeNotes} useUpdatedDate={true} />

<div class="mt-8 text-center sm:hidden">
  <a href="/rss/notes.xml">Notes RSS Feed</a>
</div>
