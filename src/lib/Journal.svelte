<script lang="ts">
  import { journalLink } from './transforms.js';

  export let id: string;
  export let title: string;
  export let content: string;
  export let titleElement = 'h1';

  $: link = journalLink(id);
</script>

<article class="pkm-page px-4 font-serif sm:px-0" {id}>
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
