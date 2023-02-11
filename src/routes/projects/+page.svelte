<script>
  import { getContext } from 'svelte';
  let titleStore = getContext('title');
  $titleStore = 'Projects';

  const projects = [
    {
      name: 'Ergo',
      repo: 'https://www.github.com/dimfeld/ergo',
      link: 'https://www.github.com/dimfeld/ergo',
      text: `Ergo is a low-code task engine built with Rust and Svelte. Think IFTTT or Zapier, but the task behavior is customizable through Javascript and tasks can be represented as state machines or as a DAG. Future work will involve task templates that take an easy configuration and internally compile down to state machines.`,
      image: 'ergo-logo-small.png',
    },
    {
      name: 'Perceive',
      repo: 'https://www.github.com/dimfeld/perceive',
      link: 'https://www.github.com/dimfeld/perceive',
      text: `In early development, Perceive is a semantic search experiment, with a goal to catalog your files, browser history, and more, and make them all searchable through a single interface that understands what you mean, even if the right words aren't there.`,
    },
    {
      name: 'Effectum',
      repo: 'https://www.github.com/dimfeld/effectum',
      link: 'https://www.github.com/dimfeld/effectum',
      text: `Effectum is a SQLite-based task queue, designed to be embedded into Rust applications. Future work will allow running it as a standalone server as well, so that it can start simple and then scale up.`,
    },
    {
      name: 'Pic Store',
      repo: 'https://www.github.com/dimfeld/pic-store',
      link: 'https://www.github.com/dimfeld/pic-store',
      text: `This is an "image CDN" application which will take uploaded images, resize and reencode them in desired formats, and store them on a CDN for use on the web. I originally wrote Effectum to power this project. (Better name pending?)`,
    },
    {
      name: 'Logseq Note Exporter',
      repo: 'https://www.github.com/dimfeld/export-logseq-notes',
      link: 'https://www.github.com/dimfeld/export-logseq-notes',
      text: 'Export selected pages from a Logseq graph. I use this to populate the notes and journals sections on this site.',
    },
    {
      name: 'Fund The Rebuild',
      repo: 'https://www.github.com/dimfeld/fund-the-rebuild',
      link: 'https://fundtherebuild.com',
      text: `This site brought attention to GoFundMe campaigns that were started in the wake of the 2020 riots. Currently dormant, but it was developed in a day and a half, and in the end was also useful in seeing how quickly I could get an MVP up and running.`,
      image: 'https://fundtherebuild.com/card.jpg',
    },
    {
      name: 'Palette Transformer',
      repo: 'https://www.github.com/dimfeld/palette-swapper',
      link: 'https://palettes.imfeld.dev',
      text: `Transform a color palette to fit any other color you want! I put this together after doing it manually once, and I wrote about the initial experience and the theory behind it <a href="/writing/transferring_color_palettes">here</a>.`,
      image: 'https://palettes.imfeld.dev/card.png',
    },
    {
      name: 'httptreemux',
      link: 'https://github.com/dimfeld/httptreemux',
      text: `I wrote a trie-based HTTP router library back in 2014 when I was learning Go. Its performance focus and flexible routing options have gained a small following, including some commercial users.`,
      image: 'projects-httptreemux.svg',
    },
  ];

  function imageUrl(s) {
    if (s && s.indexOf('://') < 0) {
      return '/images/' + s;
    }
    return s;
  }
</script>

<article class="prose m-4 self-center px-2 sm:mx-16">
  <p class="font-serif">
    For the first half of my career, most of my work has been in proprietary
    code bases. I'm steadily growing my open source contributions, and the more
    substantial ones will show up here.
  </p>

  {#each projects as project}
    <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0">
      <h1 class="block sm:hidden">
        <a href={project.link}>{project.name}</a>
        <a href={project.repo || project.link}>(Source)</a>
      </h1>
      <!--
      <div
        class="flex w-full flex-none flex-col items-stretch justify-center sm:block sm:w-48">
        {#if project.image}
          <img
            class="w-full sm:w-48"
            alt="{project.name} image"
            src={imageUrl(project.image)} />
        {/if}
      </div>
      -->
      <div class="flex flex-col">
        <h2 class="hidden sm:block">
          <a href={project.link}>{project.name}</a>
          <a href={project.repo || project.link}>(Source)</a>
        </h2>
        <p class="mt-0">{@html project.text}</p>
      </div>
    </div>
  {/each}

  <h2>Other Minor Projects</h2>
  <ul>
    <li>
      <a href="https://www.github.com/dimfeld/codemirror-json5"
        >codemirror-json5</a>
      is an NPM package providing JSON5 language support for the excellent
      <a href="https://codemirror.net/">CodeMirror</a> editor component.
    </li>
    <li>
      <a href="https://www.npmjs.com/package/sorters">Sorters</a>
      is a compact package for generating Javascript array sort comparators that
      handle things like null values, descending sort, and multi-level comparisons.
      I wrote this as I've been moving away from heavyweight utility packages.
    </li>
    <li>
      <a href="https://swr-xstate.imfeld.dev/">SWR XState</a>
      is a stale-while-revalidate data fetcher built with the
      <a href="https://xstate.js.org">XState</a>
      state machine library. Originally developed for internal use at my company,
      it provides automatic periodic refreshes with browser focus tracking, exponential
      backoff, and other nice features. I also wrote an
      <a href="/writing/swr_with_xstate">article about the implementation.</a>
    </li>
    <li>
      <a href="https://www.github.com/dimfeld/svelte-zoomable"
        >Svelte Zoomable</a>
      is an experiment in zoomable UI and advanced transitions in Svelte. This was
      a fun way to get better at understanding Svelte transitions, but ultimately
      I would favor a more traditional SVG zooming approach with some kind of level-of-detail
      based render switching, instead of pushing the limits of Svelte's transition
      system past what it was really good for.
    </li>
  </ul>
</article>
