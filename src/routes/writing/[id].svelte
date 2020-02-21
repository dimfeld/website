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
</script>

<Article title={post.title}>
  {@html post.content}
</Article>
