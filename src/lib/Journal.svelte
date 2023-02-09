<script lang="ts">
  import { journalLink } from './transforms.js';
  import ArticleFooter from './ArticleFooter.svelte';

  export let id: string;
  export let title: string;
  export let content: string;
  export let titleElement = 'h1';
  export let showFooter = false;

  $: link = journalLink(id);
</script>

<div class="content mb-12 px-4 font-serif sm:px-0">
  <article class="pkm-page" {id}>
    <div class="mb-4 leading-tight">
      <svelte:element this={titleElement} class="font-sanserif inline">
        {title}
      </svelte:element>
      <a href={link}>🔗</a>
    </div>

    <div class="content no-indent">
      {@html content}
    </div>
  </article>

  {#if showFooter}
    <ArticleFooter />
  {/if}
</div>
