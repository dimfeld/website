<script>
  import flatMap from 'lodash/flatMap';
  import get from 'lodash/get';
  import orderBy from 'lodash/orderBy';
  import uniq from 'lodash/uniq';
  import { getContext } from 'svelte';
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

<div id="notelist">
  {#each activeNotes as note (note.id)}
    <div>
      <a href="/notes/{note.id}">{note.title}</a>
    </div>
  {/each}

</div>
