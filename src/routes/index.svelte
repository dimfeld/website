<script context="module">
  import { loadFetchJson } from '$lib/fetch';
  export async function load({ fetch }) {
    let r = await loadFetchJson(fetch, '/writing/latest.json');
    if ('error' in r) {
      return r;
    }

    let { post, note, lastCreatedNote } = r.data;
    return { props: { latestPost: post, latestNote: note, lastCreatedNote } };
  }
</script>

<script>
  import NewsletterSignup from '../components/NewsletterSignup.svelte';
  export let latestPost;
  export let latestNote;
  export let lastCreatedNote;
  import { getContext, onMount } from 'svelte';
  import { annotate } from 'svelte-rough-notation';
  getContext('title').set('');

  const annotationOptions = {
    type: 'underline',
    multiline: true,
    color: '#014451',
    iterations: 3,
    visible: false,
  };

  onMount(() => {
    setTimeout(() => (annotationOptions.visible = true), 1500);
  });
</script>

<article class="m-4 self-center font-serif">
  <p>
    Welcome! This site is inspired by the
    <a href="writing/digital_garden">Digital Garden</a>
    concept, which essentially means that I'm writing not just to share information,
    but also to encourage discussion and mutual learning. If you have some thoughts
    about anything here, please feel free to reach out on
    <a href="https://www.twitter.com/dimfeld">Twitter</a>.
  </p>

  <p>
    My latest post is {#if latestPost.frontPageSummary}
      <a use:annotate={annotationOptions} href="writing/{latestPost.id}"
        >{latestPost.title}</a
      >, about {latestPost.frontPageSummary}.
    {:else}
      <a use:annotate={annotationOptions} href="writing/{latestPost.id}"
        >{latestPost.title}</a
      >.
    {/if}
  </p>

  <p>
    I also host my
    <a sveltekit:prefetch href="notes">notes</a>
    here publicly, in hopes that some readers will be educated and others can help
    fill in the gaps. {#if lastCreatedNote.id !== latestNote.id}
      <a href="notes/{lastCreatedNote.id}">{lastCreatedNote.title}</a>
      is the newest note and
      <a href="notes/{latestNote.id}">{latestNote.title}</a>
      was updated most recently.
    {:else}
      The newest note is
      <a href="notes/{latestNote.id}">{latestNote.title}</a>.
    {/if}
  </p>

  <p>
    And finally, I have a newsletter where I write about tech thoughts,
    interesting things I've read, and project updates each Thursday.
  </p>

  <NewsletterSignup />

  <h1>About Me</h1>

  <h2>Work</h2>

  <p>
    I'm a co-founder of
    <a href="https://www.carevoyance.com">Carevoyance</a>, a sales acceleration
    tool that enables healthcare sellers to zero in on their best prospects and
    generate custom reports and insights with just a few clicks.
  </p>

  <p>
    I spend most of my time there creating new data analyses, working on the
    backend API and database systems, and developing tooling to research data
    anomalies and automate repetitive tasks. Recently I've been active on the
    front-end too, and have been spearheading a transition from AngularJS (1.x)
    to Svelte.
  </p>

  <p>
    In the past I worked almost exclusively in C++ and various assembly
    languages. Now that I'm more in the web ecosystem, I'm mostly writing
    Javascript for work, but I'm using Rust more and more as well.
  </p>

  <p>
    Before starting my own venture, I interfaced with advanced network switching
    chips at
    <a href="https://www.arista.com">Arista Networks</a> and worked on JTAG
    hardware debuggers and embedded operating systems at
    <a href="https://www.ghs.com">Green Hills Software</a>. Running a small
    startup feels very different from working at these companies, and it has its
    ups and downs, but I love it.
  </p>

  <h2>Life</h2>
  <p>
    I usually have some sort of side project going on, and my most recent
    obsession is <a href="https://github.com/dimfeld/ergo">Ergo</a>, a low-code
    workflow orchestrator that is still in early stages, but coming along well.
  </p>
  <p>
    Sometimes I wish I could code all day and night, but when not hacking on
    something or spending time with my family, I enjoy good coffee, nature
    photography, reading nonfiction and sci-fi, and improving my nascent design
    and UX skills. I'm also active in my church and run the sound board there
    every few weeks.
  </p>

  <h2>Where to find me</h2>
  <p>
    <a href="https:///www.twitter.com/dimfeld">Twitter</a> is probably the best
    way to contact me, or you can email me at <em>daniel</em> at this domain.
  </p>
  <p>
    I'm fairly active on
    <a href="https:///www.github.com/dimfeld">Github</a> as well, and send out
    the <a href="https://buttondown.email/dimfeld">newsletter</a> mentioned above.
  </p>

  <h2>About this site</h2>
  <p>
    The website is written using <a href="https://svelte.dev/">Svelte</a>,
    <a href="https://sapper.svelte.dev/">Sapper</a>, and
    <a href="https://tailwindcss.com/">Tailwind</a>, and hosted on
    <a href="https://vercel.com/">Vercel</a>. Icons sourced from the
    <a href="https://refactoringui.com/">Refactoring UI</a> icon set and
    <a href="https://iconmonstr.com/">iconmonstr</a>.
  </p>

  <p>
    The prose content on this site is licensed under a
    <a rel="license" href="http://creativecommons.org/licenses/by/4.0/"
      >Creative Commons Attribution 4.0 International License</a
    >. The code can be viewed on
    <a href="https://github.com/dimfeld/website">Github</a>. The underlying code
    as well as all code examples are licensed under the
    <a href="https://choosealicense.com/licenses/mit/">MIT license</a>.
  </p>
</article>
