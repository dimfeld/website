<script>
  import { getContext } from 'svelte';
  getContext('title').set('About');
</script>

<article class="font-serif my-2 px-4">
  <h1>Work</h1>

  <p>
    I'm a co-founder of
    <a href="https://www.carevoyance.com">Carevoyance</a>, a sales acceleration
    tool that enables healthcare sellers to zero in on their best prospects and
    then generate custom reports specific to each one with just a few clicks.
  </p>

  <p>
    I spend most of my time there adding new data analyses, updating and
    maintaining the backend API and database systems, and developing tooling to
    research data anomalies and automate repetitive tasks. Now and then I get to
    touch the front-end too, and most recently have been spearheading a
    transition from AngularJS (1.x) to Svelte.
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

  <h1>Life</h1>
  <p>
    Sometimes I wish I could code all day and night, but when not hacking on
    something or spending time with my family, I enjoy good coffee, nature
    photography, reading, and improving my nascent design and UX skills. I'm
    also active in my church and run the sound board there every few weeks.
  </p>

  <h1>Where to find me</h1>
  <p>
    <a href="https:///www.twitter.com/dimfeld">Twitter</a> is probably the best
    way to contact me.
  </p>
  <p>
    I'm fairly active on
    <a href="https:///www.github.com/dimfeld">Github</a> as well, where my
    biggest project is a
    <a href="https://github.com/dimfeld/httptreemux">Go HTTP router</a> I wrote
    in 2014 but never advertised :)
  </p>

  <h1>About this site</h1>
  <p>
    The website is written using <a href="https://svelte.dev/">Svelte</a>,
    <a href="https://sapper.svelte.dev/">Sapper</a>, and
    <a href="https://tailwindcss.com/">Tailwind</a>, and hosted on
    <a href="https://zeit.co/">ZEIT Now</a>. Icons sourced from the
    <a href="https://refactoringui.com/">Refactoring UI</a> icon set and
    <a href="https://iconmonstr.com/">iconmonstr</a>.
  </p>
</article>
