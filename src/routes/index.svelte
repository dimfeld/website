<script context="module">
  export async function preload() {
    let { post, note, lastCreatedNote } = await this.fetch(
      '/data/latest'
    ).then((r) => r.json());
    return { latestPost: post, latestNote: note, lastCreatedNote };
  }
</script>

<script>
  export let latestPost;
  export let latestNote;
  export let lastCreatedNote;
  import { getContext, onMount } from 'svelte';
  import { annotate } from 'svelte-rough-notation';
  getContext('title').set('');

  const annotationOptions = {
    type: 'underline',
    color: '#014451',
    iterations: 3,
    visible: false,
  };

  onMount(() => {
    setTimeout(() => (annotationOptions.visible = true), 1000);
  });
</script>

<article class="m-4 self-center font-serif">
  <p>
    Welcome! This site is inspired by the
    <a href="writing/digital_garden">Digital Garden</a>
    concept, which essentially means that I'm writing not just to share
    information, but also to encourage discussion and mutual learning. Please
    feel free to reach out on
    <a href="https://www.twitter.com/dimfeld">Twitter</a>
    if you have some thoughts about anything here.
  </p>

  <p>
    My latest post is
    {#if latestPost.frontPageSummary}
      <a use:annotate={annotationOptions} href="writing/{latestPost.id}">
        {latestPost.title}
      </a>
      , about {latestPost.frontPageSummary}.
    {:else}
      <a use:annotate={annotationOptions} href="writing/{latestPost.id}">
        {latestPost.title}
      </a>
      .
    {/if}
  </p>

  <p>
    I also post my
    <a rel="prefetch" href="notes">notes</a>
    publicly, in hopes that some readers will be educated and others can help
    fill in the gaps.
    {#if lastCreatedNote.id !== latestNote.id}
      <a href="notes/{lastCreatedNote.id}">{lastCreatedNote.title}</a>
      is the newest note and
      <a href="notes/{latestNote.id}">{latestNote.title}</a>
      was updated most recently.
    {:else}
      The newest note is
      <a href="notes/{latestNote.id}">{latestNote.title}</a>
      .
    {/if}
  </p>
</article>
