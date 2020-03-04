<script context="module">
  export async function preload({ params: { path } }) {
    let note = await this.fetch(`/api/notes/${path.join('/')}`).then((r) =>
      r.json()
    );
    return { note };
  }
</script>

<script>
  import Article from '../writing/_Article.svelte';
  export let note;
</script>

<svelte:head>
  <meta
    name="Description"
    content={[`${note.title} by Daniel Imfeld`, note.summary]
      .filter(Boolean)
      .join(' - ')} />
</svelte:head>

<div class="sm:mr-8">
  <Article {...note}>
    {@html note.content}
  </Article>
</div>
