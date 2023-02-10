<script>
  export let title;
  export let date = undefined;
  export let updated = undefined;
  export let confidence = undefined;
  export let source = undefined;
  export let type;
  export let content;
  export let showFooter = true;
  export let titleElement = 'h1';

  import ArticleFooter from '$lib/ArticleFooter.svelte';
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

<article
  class:pkm-page={source === 'pkm'}
  class:font-serif={type === 'post'}
  class="prose mb-12 px-4 sm:px-0">
  <div class="mb-4 leading-tight">
    <svelte:element this={titleElement} class="mb-1 font-serif"
      >{title}</svelte:element>

    <div>
      {#if date?.valueOf()}
        Written
        <time>{date.slice(0, 10)}</time>
      {/if}
      {#if updated?.valueOf() && updated.valueOf() !== date?.valueOf()}
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

  {#if showFooter}
    <ArticleFooter />
  {/if}
</article>
