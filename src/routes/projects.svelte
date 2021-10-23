<script context="module">
  export const prerender = true;
</script>

<script>
  const projects = [
    {
      name: 'Ergo',
      repo: 'https://www.github.com/dimfeld/ergo',
      link: 'https://www.github.com/dimfeld/ergo',
      text: `Ergo is a low-code task engine built with Rust and Svelte. Think IFTTT or Zapier, but the task behavior is customizable through Javascript and tasks can contain state machines.`,
      image: 'ergo-logo-small.png',
    },
    {
      name: 'Roam Note Exporter',
      repo: 'https://www.github.com/dimfeld/export-roam-notes',
      link: 'https://www.github.com/dimfeld/export-roam-notes',
      text:
        'Export selected pages from a Roam Research graph. I use this to populate the note section on this site.',
    },
    {
      name: 'Fund The Rebuild',
      repo: 'https://www.github.com/dimfeld/fund-the-rebuild',
      link: 'https://fundtherebuild.com',
      text: `(Currently dormant.) We all hear about the GoFundMe pages that go viral and exceed their fundraising goals. But many don't attract much attention &mdash; fundraisers for goals just as important, but perhaps without the social media savvy to get coverage. This site brings attention to those forgotten GoFundMe campaigns that were started in the wake of the 2020 riots.`,
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
      name: 'Video Trimmer',
      link: 'https://github.com/dimfeld/video-trimmer-gui',
      text: `A mostly-finished project I'm putting together for my church. Take a selection from a video, and add an intro and outro without the complexity of a full-fledged video editor.`,
      image: 'projects-video-trimmer.jpg',
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

<article class="m-4 sm:mx-16 self-center">
  <p class="font-serif">
    Until recently, most of my career work has been in proprietary code bases.
    I'm steadily growing my open source contributions, and the more substantial
    ones will show up here.
  </p>

  {#each projects as project}
    <div class="flex flex-col space-y-4 mt-4 sm:flex-row sm:space-y-0">
      <h1 class="block sm:hidden">
        <a href={project.link}>{project.name}</a>
        <a href={project.repo || project.link}>(Source)</a>
      </h1>
      <div
        class="flex-none flex flex-col items-stretch w-full justify-center sm:block sm:w-48">
        {#if project.image}
          <img
            class="w-full sm:w-48"
            alt="{project.name} image"
            src={imageUrl(project.image)} />
        {/if}
      </div>
      <div class="flex flex-col sm:ml-12">
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
      <a href="https://www.github.com/dimfeld/svelte-zoomable"
        >Svelte Zoomable</a>
      is an experiment in zoomable UI and advanced transitions in Svelte.
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
  </ul>
</article>
