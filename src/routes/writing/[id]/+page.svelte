<script lang="ts">
  import type { PageData } from './$types';
  import Article from '../_Article.svelte';

  export let data: PageData;

  $: post = data.post;

  let imageUrl: string;
  $: {
    let { cardImage } = post;
    if (cardImage && !cardImage.startsWith('http')) {
      imageUrl = `${process.env.SITE_DOMAIN}/images/${cardImage}`;
    } else {
      imageUrl = `${process.env.SITE_DOMAIN}/writing/${post.id}.og-image.png`;
    }
  }

  $: cardType = post.cardType || 'summary_large_image';
</script>

<svelte:head>
  <link rel="canonical" href="https://imfeld.dev/writing/{post.id}" />
  <meta
    name="Description"
    content={[`${post.title} by Daniel Imfeld`, post.summary]
      .filter(Boolean)
      .join(' - ')} />
  {#if post.tags}
    <meta name="keywords" content={post.tags.join(', ')} />
  {/if}
  <meta property="og:title" content={post.title} />
  <meta name="twitter:title" content={post.title} />
  <meta name="twitter:creator" content="@dimfeld" />
  <meta property="og:type" content="article" />
  <meta property="og:description" content={post.summary} />
  <meta name="twitter:description" content={post.summary} />
  <meta name="twitter:card" content={cardType} />
  <meta name="twitter:image" content={imageUrl} />
  <meta property="og:image" content={imageUrl} />
</svelte:head>

<div class="sm:mx-16">
  <Article {...post} />
</div>
