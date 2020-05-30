<script>
  const projects = [
    {
      name: 'Palette Transformer',
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

<style>
  /* img {
    width: 200px;
  } */
</style>

<article class="m-4 sm:mx-16 self-center">

  <p class="font-serif">
    Until recently, most of my career work has been in proprietary code bases.
    I'm steadily growing my open source contributions, and the more interesting
    ones will show up here.
  </p>

  {#each projects as project}
    <div
      class="flex flex-col space-y-4 mt-4 sm:flex-row sm:space-x-12 sm:space-y-0">
      <div
        class="flex-none flex flex-col items-stretch w-full justify-center
        sm:block sm:w-auto">
        <img
          class="w-full sm:w-48"
          alt="{project.name} image"
          src={imageUrl(project.image)} />
      </div>
      <div class="flex flex-col">
        <h2>
          <a href={project.link}>{project.name}</a>
        </h2>
        <p class="mt-0">
          {@html project.text}
        </p>
      </div>
    </div>
  {/each}
</article>
