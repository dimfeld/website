<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit';
  import { loadFetchJson } from '$lib/fetch';

  export const prerender = true;
  export const load: Load = async function load({ fetch, params }) {
    let result = await loadFetchJson(fetch, `/writing/${params.id}.json`);
    if ('error' in result) {
      return result;
    }

    return { props: result.data };
  };
</script>

<script lang="ts">
  import type { Post } from '$lib/readPosts';
  import Article from './_Article.svelte';
  export let post: Post;

  let imageUrl = post.cardImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${process.env.SITE_DOMAIN}/images/${imageUrl}`;
  } else {
    imageUrl = `${process.env.SITE_DOMAIN}/writing/${post.id}.og-image.png`;
  }

  let cardType = post.cardType || 'summary_large_image';
</script>

<svelte:head>
  <link rel="canonical" href="https://imfeld.dev/writing/{post.id}" />
  <meta name="Description" content={[`${post.title} by Daniel Imfeld`, post.summary].filter(Boolean).join(' - ')} />
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
