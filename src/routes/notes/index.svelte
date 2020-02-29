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
  const activeTags = getContext('activeTags');

  const sortField = 'date';
  $: activeNotes = $activeTags.length
    ? orderBy(
        uniq(flatMap($activeTags, (t) => get(tags, [t, 'posts'], []))).map(
          (id) => noteLookup[id]
        ),
        sortField,
        'desc'
      )
    : notes;
</script>

<PostList base="notes" posts={activeNotes} />
