<script>
  export let title;
  export let date;
</script>

<article class="mt-4">
  <div class="leading-none">
    <h2 class="text-2xl">{title}</h2>
    <time class="text-sm block">{date.slice(0, 10)}</time>
  </div>

  <slot />
</article>
