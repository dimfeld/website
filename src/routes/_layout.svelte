<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Nav from './_Nav.svelte';
  export let segment;

  const titleStore = writable('');
  setContext('title', titleStore);

  $: title = $titleStore ? `${$titleStore} - Daniel Imfeld` : 'Daniel Imfeld';
</script>

<svelte:head>
  <title>{title}</title>
</svelte:head>

<div class="flex flex-col min-h-screen">
  <Nav {segment} />
  <slot />
</div>

<style lang="postcss" global>
  html {
    article {
      max-width: 65ch;
      @apply leading-relaxed ml-auto mr-auto;
    }

    article ul {
      @apply my-4;
    }

    article ol {
      @apply my-4;
    }

    article ol > li {
      @apply list-inside list-decimal;
    }

    article ul > li {
      @apply list-inside list-disc;
    }

    article ul li,
    article ol li {
      margin-left: 0.5rem;
      margin-top: 0px;
      margin-bottom: 0px;
    }

    article p > img:only-child {
      @apply mx-auto;
    }

    blockquote {
      @apply border-l-4 border-teal-600 -ml-2 pl-3 pr-4 my-4 italic;
    }

    code,
    pre {
      @apply font-mono leading-snug;
      box-decoration-break: clone;
    }

    code {
      @apply bg-cool-gray-200 text-teal-900 px-1 text-base;
    }

    a code {
      @apply underline;
    }

    pre > code {
      @apply block border-cool-gray-300 bg-cool-gray-200 text-black px-4 py-2 my-4 whitespace-pre overflow-x-auto shadow-lg;
    }

    article h1 + p,
    article h2 + p,
    article h3 + p,
    article h4 + p {
      @apply mt-2 mb-4;
    }

    article * + p,
    article > * + div,
    hr {
      @apply my-4;
    }

    article table {
      @apply align-middle inline-block shadow overflow-hidden border-b border-gray-200 font-sans;
    }

    article table th {
      @apply px-6 py-3 border-b border-gray-200 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider;
    }
    article table td {
      @apply px-6 py-4 whitespace-nowrap text-sm leading-5 font-medium text-gray-900;
    }

    @screen sm {
      article table {
        @apply rounded-lg;
      }
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

    h1,
    h2,
    h3,
    h4 {
      @apply font-medium font-sans text-teal-900;
    }

    h1 {
      @apply text-2xl;
    }

    h2 {
      @apply text-xl;
    }

    h3 {
      @apply text-lg;
    }

    h4 {
      @apply text-base;
    }

    h1:not(:first-child),
    h2:not(:first-child),
    h3:not(:first-child),
    h4:not(:first-child) {
      @apply mt-4 mb-2;
    }

    svg .primary {
      fill: #b2f5ea;
    }

    svg .secondary {
      fill: #2c7a7b;
      color: #2c7a7b;
    }

    .hljs-addition {
      @apply text-green-600;
    }

    .hljs-deletion {
      @apply text-red-600;
    }

    article aside.note {
      @apply px-4 py-4 text-sm bg-teal-100 bg-opacity-75 border-cool-gray-300 border;
    }

    div.responsive-svg {
      @apply my-4 w-full mx-auto;
    }

    @screen sm {
      div.responsive-svg {
        @apply w-3/4;
      }
    }

    @screen md {
      div.responsive-svg {
        @apply w-1/2;
      }
    }

    /* From https://css-tricks.com/full-width-containers-limited-width-parents/ */
    .w-expanded-95 {
      width: 95vw;
      position: relative;
      left: 50%;
      right: 50%;
      margin-left: -47.5vw;
      margin-right: -47.5vw;
    }

    .side-by-side {
      display: grid;

      /* Mobile. See below for desktop layout */
      grid-template-columns: 1fr;

      place-items: stretch;
      @apply my-4;
    }
  }

  @screen sm {
    html {
      article ul li,
      article ol li {
        @apply list-outside ml-0;
      }

      blockquote {
        @apply -ml-4 pl-6 pr-0;
      }

      pre > code {
        @apply whitespace-pre-wrap;
      }

      .side-by-side {
        grid-template-columns: minmax(30%, 60ch) minmax(70%, 1fr);
        width: 95vw;
        position: relative;
        left: 50%;
        right: 50%;
        @apply my-8;
        margin-left: max(-47.5vw, -70ch);
        margin-right: max(-47.5vw, -70ch);
        max-width: 140ch;

        & > * {
          @apply border-t border-dotted border-cool-gray-400;
        }

        .left {
          @apply pr-2 mb-4;

          ul > li,
          ol > li {
            @apply list-inside;
          }
        }

        pre {
          @apply h-full w-full;
        }

        pre > code {
          @apply h-full w-full my-0 block bg-cool-gray-200 text-black px-4 py-0 whitespace-pre-wrap overflow-x-auto shadow-none;
        }
      }
    }
  }

  article .has-component > *:not(:last-child) {
    display: none;
  }

  article.roam-page {
    .rm-heading-1 {
      @apply text-2xl;
    }

    .rm-heading-2 {
      @apply text-xl;
    }

    .rm-heading-3 {
      @apply text-lg;
    }

    ul,
    ol {
      margin-top: 0rem;
      margin-bottom: 0rem;
    }

    li {
      @apply my-2;
    }

    ul.list-document > li {
      list-style: none;
      @apply my-4;
    }

    blockquote {
      @apply ml-0 px-3;
    }

    li ul > li,
    li ol > li {
      margin-left: 2rem;
    }
  }
</style>
