<script>
  import { getContext } from 'svelte';
  let titleStore = getContext('title');
  $titleStore = 'Projects';

  const projects = [
    {
      name: `Should've Been a Blog Post`,
      repo: 'https://www.github.com/dimfeld/sbbp',
      link: 'https://www.github.com/dimfeld/sbbp',
      text: `Should've Been a Blog Post (SBBP) downloads videos from Youtube, creates a high-quality transcript, and
        places that transcript alongside extracted images from the video. Snarky name aside, I love reading conference talks in this tool.`,
      notes: '/notes/projects_sbbp',
    },
    {
      name: 'PromptBox',
      repo: 'https://www.github.com/dimfeld/promptbox',
      link: 'https://promptbox.imfeld.dev',
      text: `PromptBox is a utility that manages libraries of LLM prompt templates,
        which can be filled in and submitted from the command line.`,
      notes: '/notes/projects_promptbox',
    },
    {
      name: 'sqlweld',
      repo: 'https://www.github.com/dimfeld/sqlweld',
      link: 'https://sqlweld.imfeld.dev',
      text: `sqlweld is a utility that lets you write SQL in the Liquid template syntax, helping to
        manage common clauses and generate multiple variants on a single query.`,
    },
    {
      name: 'Glance',
      repo: 'https://www.github.com/dimfeld/glance',
      link: 'https://www.github.com/dimfeld/glance',
      text: `Glance is a project that allows creation of a bunch of mini-apps which can do things like scrape data on
        some interval, and push it to a dashboard which shows data from all the apps together in one place.`,
      notes: '/notes/projects_glance',
    },
    {
      name: 'Buzzy',
      repo: 'https://www.github.com/dimfeld/buzzy',
      link: 'https://www.github.com/dimfeld/buzzy',
      text: `Buzzy is an AI companion for children. My kids love talking to Alexa but it frequently doesn't understand questions,
        so this is an attempt to do something better and run on low-power devices.`,
      notes: '/notes/projects_buzzy',
    },
    {
      name: 'Smelter',
      repo: 'https://www.github.com/dimfeld/smelter',
      link: 'https://www.github.com/dimfeld/smelter',
      text: `Smelter is a data processing framework designed to harness serverless workers. Imagine thousands of Lambdas processing
        hundreds of GBs of files in S3 with low latency.`,
    },
    {
      name: 'Ergo',
      repo: 'https://www.github.com/dimfeld/ergo',
      link: 'https://www.github.com/dimfeld/ergo',
      text: `Ergo is a low-code task engine built with Rust and Svelte. Think IFTTT or Zapier, but the task behavior is customizable
        through Javascript and tasks can be represented as state machines or as a DAG. Currently dormant and much of the functionality
        I really wanted from this will be done by Glance (above), but I learned a lot, especially about embedding V8 in Rust.`,
      image: 'ergo-logo-small.png',
      notes: '/notes/projects_ergo',
    },
    {
      name: 'Effectum',
      repo: 'https://www.github.com/dimfeld/effectum',
      link: 'https://www.github.com/dimfeld/effectum',
      text: `Effectum is a SQLite-based task queue, designed to be embedded into Rust applications. Future work will focus
        running it as a standalone server, embedding into Node.js, and running workers inside services such as AWS Lambda and Fly Machines.`,
      notes: '/notes/projects_effectum',
    },
    {
      name: 'Pic Store',
      repo: 'https://www.github.com/dimfeld/pic-store',
      link: 'https://www.github.com/dimfeld/pic-store',
      text: `This is an "image CDN" application which takes uploaded images, resizes and reencodes them in desired formats, and
      store them on a CDN for use on the web. I originally wrote Effectum to power this project. (Better name pending?)<br /> Most of the
      images on this site were processed through Pic Store.`,
      notes: '/notes/projects_pic_store',
    },
    {
      name: 'Logseq Note Exporter',
      repo: 'https://www.github.com/dimfeld/export-logseq-notes',
      link: 'https://www.github.com/dimfeld/export-logseq-notes',
      text: `Export selected pages from a Logseq graph. I use this to populate the notes and journals sections on this site,
      and most of the newer long-form writing as well.`,
    },
    {
      name: 'Perceive',
      repo: 'https://www.github.com/dimfeld/perceive',
      link: 'https://www.github.com/dimfeld/perceive',
      text: `Perceive was a semantic search experiment during December 2022 before RAG apps were dime-a-dozen, with a goal to catalog your files,
      browser history, and more, and make them all searchable through a single interface that understands what you mean, even if the right words aren't there.`,
      notes: '/notes/projects_perceive',
    },
    {
      name: 'httptreemux',
      link: 'https://github.com/dimfeld/httptreemux',
      text: `I wrote a trie-based HTTP router library back in 2014 when I was learning Go. I'm no longer developing this, but
        its performance focus and flexible routing options have gained a small following, including some commercial users.`,
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

  <section class="flex flex-col gap-8">
    {#each projects as project}
      <div class="flex flex-col gap-4 sm:flex-row">
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
          <p class="my-0">{@html project.text}</p>
          {#if project.notes}
            <p class="mt-2 mb-0"><a href={project.notes}>Notes</a></p>
          {/if}
        </div>
      </div>
    {/each}
  </section>

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
    <li>
      <a href="https://fundtherebuild.com/">Fund the Rebuild</a> brought attention
      to GoFundMe campaigns that were started in the wake of the 2020 riots. Currently
      dormant, but it was developed in a day and a half, and in the end was also
      useful in seeing how quickly I could get an MVP up and running.
    </li>
    <li>
      <a href="https://palettes.imfeld.dev">Palette Transformer</a> transforms a
      color palette to fit any other color you want! I put this together after
      doing it manually once, and I wrote about the initial experience and the
      theory behind it <a href="/writing/transferring_color_palettes">here</a>.
    </li>
  </ul>
</article>
