<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import GlobalCss from './_GlobalCss.svelte';
  import Nav from './_Nav.svelte';
  export let segment;

  const titleStore = writable('');
  setContext('title', titleStore);

  $: title = $titleStore ? `${$titleStore} - Daniel Imfeld` : 'Daniel Imfeld';
</script>

<style global>
  * {
    position: relative;
  }

  body {
    font-family: 'Inter', 'Open Sans', 'Helvetica', 'Verdana', sans-serif;
    font-size: 16px;
  }

  article {
    max-width: 95ch;
    @apply leading-relaxed ml-auto mr-auto;
  }

  article ul {
    @apply mt-4;
  }

  article ol {
    @apply mt-4;
  }

  article ol > li {
    @apply list-inside list-decimal;
  }

  article ul > li {
    @apply list-inside list-disc;
  }

  article p > img:only-child {
    @apply mx-auto;
  }

  blockquote {
    @apply border-l-4 border-teal-600 -ml-2 pl-3 pr-4 mt-4 italic;
  }

  @media (min-width: 640px) {
    article ul > li {
      @apply list-outside;
    }

    article ol > li {
      @apply list-outside;
    }

    blockquote {
      @apply -ml-5 pl-7 pr-0;
    }
  }

  code,
  pre {
    @apply font-mono leading-snug;
    box-decoration-break: clone;
  }

  code {
    @apply border border-red-400 bg-gray-200 text-red-700 px-1 text-base;
  }

  pre > code {
    @apply block border-gray-400 bg-gray-200 text-black px-4 py-2 mt-4 whitespace-pre-wrap overflow-x-auto;
  }

  article h1 + p {
    @apply mt-2;
  }

  article h2 + p {
    @apply mt-2;
  }

  article h3 + p {
    @apply mt-2;
  }

  article * + p {
    @apply mt-4;
  }

  article > * + div {
    @apply mt-4;
  }

  article table {
    @apply align-middle inline-block shadow overflow-hidden border-b border-gray-200 font-sans;
  }

  article table th {
    @apply px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider;
  }

  article table td {
    @apply px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900;
  }

  @media (min-width: 640px) {
    article table {
      @apply rounded-lg;
    }
  }

  hr {
    @apply mt-4;
  }

  hr.footnotes-sep {
    @apply mt-8;
  }

  a {
    @apply text-teal-700;
  }

  a:hover {
    text-decoration: underline;
  }

  h1 {
    @apply text-2xl font-medium font-sans text-teal-900;
  }

  h2 {
    @apply text-xl font-medium font-sans text-teal-900;
  }

  h3 {
    @apply text-lg font-medium font-sans text-teal-900;
  }

  h4 {
    @apply text-base font-medium font-sans text-teal-900;
  }

  h1:not(:first-child),
  h2:not(:first-child),
  h3:not(:first-child),
  h4:not(:first-child) {
    @apply mt-4;
  }

  svg .primary {
    fill: #b2f5ea;
  }

  svg .secondary {
    fill: #2c7a7b;
    color: #2c7a7b;
  }
</style>

<svelte:head>
  <title>{title}</title>
  <GlobalCss />
</svelte:head>

<div class="flex flex-col min-h-screen">
  <Nav {segment} />
  <slot />
</div>
