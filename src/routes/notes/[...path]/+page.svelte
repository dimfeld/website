<script lang="ts">
  import type { PageData } from './$types';
  import Article from '../../writing/_Article.svelte';
  export let data: PageData;
  $: note = data.note;

  let imageUrl: string;
  $: {
    imageUrl = note.cardImage;
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = `${process.env.SITE_DOMAIN}/images/${imageUrl}`;
    } else {
      imageUrl = `${process.env.SITE_DOMAIN}/notes/${note.id.replace(
        /\//g,
        '_'
      )}.og-image.png`;
    }
  }

  $: cardType = note.cardType || 'summary_large_image';
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

<div class="my-4 sm:mr-16">
  <Article {...note} />
</div>
