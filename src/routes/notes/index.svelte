<script>
  import flatMap from 'lodash/flatMap';
  import get from 'lodash/get';
  import orderBy from 'lodash/orderBy';
  import uniq from 'lodash/uniq';
  import { getContext } from 'svelte';
  import PostList from '../_PostList.svelte';
  const notes = getContext('noteList');
  const noteLookup = getContext('noteLookup');
  const tags = getContext('tags');
  const activeTag = getContext('activeTag');
  const search = getContext('search');

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

    if ($search) {
      let searchValue = $search.toLowerCase();
      activeNotes = activeNotes.filter((n) =>
        n.title.toLowerCase().includes(searchValue)
      );
    }
  }
</script>

<PostList base="notes" posts={activeNotes} />

<div class="text-center sm:hidden mt-8">
  <a href="/rss/notes.xml">Notes RSS Feed</a>
</div>
