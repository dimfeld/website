<script lang="ts">
  import type { PageData } from './$types';
  import { getContext, onMount } from 'svelte';
  import { annotate } from 'svelte-rough-notation';
  import * as contact from '$lib/contact';
  import Journal from '$lib/Journal.svelte';
  import NewsletterSignup from '$lib/components/NewsletterSignup.svelte';

  export let data: PageData;
  $: ({ latestPosts, latestNotes, latestJournals, lastCreatedNote } = data);

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

<main class="prose m-4 self-center px-2 font-serif">
  <div class="grid-cols-2 md:grid">
    <section>
      <h1 class="mb-0">Recent Writing</h1>
      <ul class="mt-2">
        {#each latestPosts as post}
          <li>
            <a href="writing/{post.id}" data-sveltekit-preload-data
              >{post.title}</a>
          </li>
        {/each}
        <li><a href="/writing" data-sveltekit-preload-data>All Posts</a></li>
      </ul>
    </section>

    <section>
      <h1 class="mb-0">Notebook</h1>
      <ul class="mt-2">
        {#if !latestNotes.find((n) => n.id === lastCreatedNote.id)}
          <li>
            <a href="/notes/{lastCreatedNote.id}" data-sveltekit-preload-data
              >{lastCreatedNote.title}</a>
          </li>
        {/if}

        {#each latestNotes as note}
          <li>
            <a href="notes/{note.id}" data-sveltekit-preload-data
              >{note.title}</a>
          </li>
        {/each}
        <li><a href="/notes" data-sveltekit-preload-data>All Notes</a></li>
      </ul>
    </section>
  </div>

  <section>
    <h1>Latest Updates</h1>

    <div class="mt-2 flex flex-col items-start gap-4">
      {#each latestJournals as post}
        <Journal {...post} titleElement="h2" />
      {/each}
    </div>

    <p>
      <a
        data-sveltekit-preload-data
        href="/journals#{data.nextJournal}"
        class="font-medium">
        See more daily updates...
      </a>
    </p>
  </section>

  <p class="mt-4">
    If you like what you've read here, please consider subscribing to my
    weekly-ish newsletter, where I announce new articles and share other
    interesting things I've found.
    <NewsletterSignup />
  </p>

  <h1 id="aboutme">About Me</h1>

  <h2>Work</h2>

  <p class="prose">
    I'm a co-founder of
    <a href="https://www.carevoyance.com">Carevoyance</a> (acquired by
    <a href="https://www.h1.co">H1 Insights</a>), a sales acceleration tool that
    analyzes healthcare data and enables healthcare sellers to zero in on their
    best prospects and generate custom reports and insights with just a few
    clicks.
  </p>

  <p class="prose">
    I spend most of my time there creating new data analyses, working on the
    backend API and database systems, and developing tooling to research data
    anomalies and automate repetitive tasks. Recently I've been active on the
    front-end too, and have been enjoying the Svelte framework.
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
    way to contact me, and I'm trying out
    <a rel="me" href={contact.mastodon}>Mastodon</a>
    as well. You can also email me at <em>daniel</em> at this domain or find me
    on
    <a href="https:///www.github.com/dimfeld">Github</a>.
  </p>

  <h2>About this site</h2>
  <p>
    The website is written using <a href="https://kit.svelte.dev/">SvelteKit</a
    >,
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
</main>
