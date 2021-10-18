<script context="module">
  import { loadFetchJson } from '../../lib/fetch';

  export async function load({
    fetch,
    page: {
      params: { path },
    },
  }) {
    let result = await loadFetchJson(fetch, `/notes/note/${path}.json`);
    if ('error' in result) {
      return result;
    }

    return { props: result.data };
  }
</script>

<script>
  import Article from '../writing/_Article.svelte';
  export let note;

  let imageUrl = note.cardImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `/images/${imageUrl}`;
  } else {
    imageUrl = `${note.id.replace(/\//g, '_')}.og-image.png`;
  }

  let cardType = note.cardType || 'summary_large_image';
</script>

<svelte:head>
  <link rel="canonical" href="https://imfeld.dev/notes/{note.id}" />
  <meta
    name="Description"
    content={[`${note.title} by Daniel Imfeld`, note.summary]
      .filter(Boolean)
      .join(' - ')} />
  {#if note.tags}
    <meta name="keywords" content={note.tags.join(', ')} />
  {/if}
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

<div class="sm:mr-16">
  <Article {...note} />
</div>
