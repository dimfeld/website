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

  let imageUrl = note.cardImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = 'https://imfeld.dev/images/' + imageUrl;
  }

  let cardType = note.cardType;
  if (!cardType) {
    cardType = note.cardImage ? 'summary_large_image' : 'summary';
  }
</script>

<svelte:head>
  <meta
    name="Description"
    content={[`${note.title} by Daniel Imfeld`, note.summary]
      .filter(Boolean)
      .join(' - ')} />
  <meta property="og:title" content={note.title} />
  <meta name="twitter:title" content={note.title} />
  <meta name="twitter:creator" content="@dimfeld" />
  <meta property="og:type" content="article" />
  <meta property="og:description" content={note.summary} />
  <meta name="twitter:description" content={note.summary} />
  <meta name="twitter:card" content={cardType} />
  {#if imageUrl}
    <meta name="twitter:image" content={imageUrl} />
    <meta property="og:image" content={imageUrl} />
  {/if}
</svelte:head>

<div class="sm:mr-8">
  <Article {...note}>
    {@html note.content}
  </Article>
</div>
