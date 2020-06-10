<script>
  const projects = [
    {
      name: 'Fund The Rebuild',
      repo: 'https://www.github.com/dimfeld/fund-the-rebuild',
      link: 'https://fundtherebuild.com',
      text: `We all hear about the GoFundMe pages that go viral and exceed their fundraising goals. But many don't attract much attention &mdash; fundraisers for goals just as important, but perhaps without the social media savvy to get coverage. This site brings attention to those forgotten GoFundMe campaigns that were started in the wake of the 2020 riots.`,
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
        class="flex-none flex flex-col items-stretch w-full justify-center
        sm:block sm:w-auto">
        <img
          class="w-full sm:w-48"
          alt="{project.name} image"
          src={imageUrl(project.image)} />
      </div>
      <div class="flex flex-col sm:ml-12 ">
        <h2 class="hidden sm:block">
          <a href={project.link}>{project.name}</a>
          <a href={project.repo || project.link}>(Source)</a>
        </h2>
        <p class="mt-0">
          {@html project.text}
        </p>
      </div>
    </div>
  {/each}
</article>