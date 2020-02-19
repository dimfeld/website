<script context="module">
  export async function preload({ params }) {
    let post = await this.fetch(`/api/posts/${params.id}`).then((r) =>
      r.json()
    );
    return { post };
  }
</script>

<script>
  export let post;
</script>

<article class="mt-4">
  <h2 class="text-2xl mb-2">{post.title}</h2>
  {@html post.content}
</article>
