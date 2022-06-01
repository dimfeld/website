<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let confidence = undefined;
  export let source = undefined;
  export let type;
  export let content;

  import * as labels from '../../postMeta.ts';
  import { tick, getContext, onMount } from 'svelte';
  import instantiateComponents from '../../dynamicComponents';
  let titleStore = getContext('title');
  $titleStore = title;

  let destroyComponents;
  let mounted = false;
  onMount(() => {
    mounted = true;
    remountDynamicComponents();
    return unmountDynamicComponents;
  });

  function unmountDynamicComponents() {
    if (destroyComponents) {
      let d = destroyComponents;
      destroyComponents = null;
      return d.then((f) => f());
    }
  }

  async function remountDynamicComponents() {
    if (!mounted) {
      return;
    }

    await unmountDynamicComponents();
    // Wait for DOM to update with new content
    await tick();
    destroyComponents = instantiateComponents();
  }

  $: content, remountDynamicComponents();
</script>

<article class:roam-page={source === 'roam'} class:font-serif={type === 'post'} class="my-4 px-4 sm:px-0">
  <div class="mb-4 leading-tight">
    <h1 class="font-serif">{title}</h1>

    <div>
      {#if date}
        Written
        <time>{date.slice(0, 10)}</time>
      {/if}
      {#if updated && updated !== date}
        &mdash; Updated
        <time>{updated.slice(0, 10)}</time>
      {/if}
    </div>

    {#if confidence}
      <p class="border border-gray-300 bg-gray-100 p-4">
        Confidence: {confidence}
      </p>
    {/if}
  </div>

  <div class="content">
    {@html content}
  </div>

  <hr />
  <p>
    Thanks for reading! If you have any questions or comments, please
    <a href="https://www.twitter.com/dimfeld">send me a note on Twitter.</a>
  </p>
</article>
