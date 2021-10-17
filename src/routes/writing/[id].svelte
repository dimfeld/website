<script context="module">
  export async function load({ fetch, page }) {
    let post = await fetch(`/data/posts/${page.params.id}`).then(async (r) => {
      if (r.ok) {
        return r.json();
      } else {
        let body = await r.text();
        this.error(r.status, body || r.statusText);
      }
    });
    return { props: { post } };
  }
</script>

<script>
  import Article from './_Article.svelte';
  export let post;

  let imageUrl = post.cardImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = 'process.env.SITE_DOMAIN/images/' + imageUrl;
  } else {
    imageUrl = `process.env.SITE_DOMAIN/api/og-image/post_${post.id}`;
  }

  let cardType = post.cardType || 'summary_large_image';
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
  {#if imageUrl}
    <meta name="twitter:image" content={imageUrl} />
    <meta property="og:image" content={imageUrl} />
  {/if}
</svelte:head>

<div class="sm:mx-16">
  <Article {...post} />
</div>
