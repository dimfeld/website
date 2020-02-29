<script context="module">
  export async function preload({ params: { path } }) {
    let note = await this.fetch(`/api/notes/${path.join('/')}`).then((r) =>
      r.json()
    );
    return { note };
  }
</script>

<script>
  import { getContext } from 'svelte';
  export let note;

  getContext('activeTags').set(note.tags);
</script>

<div>
  <h1>{note.title}</h1>
  {@html note.content}
</div>
