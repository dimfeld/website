<script>
  import get from 'just-safe-get';
  import orderBy from 'lodash/orderBy';
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
      activeNotes = orderBy(
        get(tags, [$activeTag, 'posts'], []).map((id) => noteLookup[id]),
        sortField,
        'desc'
      );
    }

    activeNotes = filterText(activeNotes, $search);
  }
</script>

<svelte:head>
  <meta name="Description" content="Notes by Daniel Imfeld" />
</svelte:head>

<PostList base="notes" posts={activeNotes} useUpdatedDate={true} />

<div class="text-center sm:hidden mt-8">
  <a href="/rss/notes.xml">Notes RSS Feed</a>
</div>
