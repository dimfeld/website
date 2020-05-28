<script context="module">
  export async function preload({ params }) {
    let post = await this.fetch(`/api/posts/${params.id}`).then(async (r) => {
      if (r.ok) {
        return r.json();
      } else {
        let body = await r.text();
        this.error(r.status, body || r.statusText);
      }
    });
    return { post };
  }
</script>

<script>
  import Article from './_Article.svelte';
  export let post;

  let imageUrl = post.cardImage;
  if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = 'https://imfeld.dev/images/' + imageUrl;
  }

  let cardType = post.cardType;
  if (!cardType) {
    cardType = post.cardImage ? 'summary_large_image' : 'summary';
  }
</script>

<svelte:head>
  <meta
    name="Description"
    content={[`${post.title} by Daniel Imfeld`, post.summary]
      .filter(Boolean)
      .join(' - ')} />
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
  <Article {...post}>
    {@html post.content}
  </Article>
</div>
