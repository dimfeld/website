---
title: Svelte Transitions for Routes and Overlapping Elements
date: 2021-01-05
tags: Svelte, transitions
---

Svelte's transition system is praised for its ease of use, but it doesn’t handle everything for you. One common case that needs some extra care is transitioning between elements that are both supposed to occupy the same space.

Instead of the elements smoothly transitioning into the same spot, they both exist in the DOM at the same time, so the browser renders one element next to the other while the transitions run.  When the outgoing element disappears, the new element then jumps into the correct place.

<div data-component="BadTransitionJump"></div>

This is unsightly at best, but it's pretty easy to fix with a quick application of CSS Grid.

The container element is a grid with one row and one column. The children elements are then all forced to be in the first row and column, so they will overlap. (Without this, the browser will assume you made a mistake and add extra grid cells.)

Then you just set up the transitions on your elements, and you're ready to go!

```svelte
<style>
  .transition-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  .transition-container > * {
    grid-row: 1;
    grid-column: 1;
  }
</style>

<div class="transition-container">
  {#if enabled}
    <h1 in:fly={{ x: -200 }} out:fade>Enabled!</h1>
  {:else}
    <h1 in:fly={{ x: -200 }} out:fade>Disabled!</h1>
  {/if}
</div>
```

<div data-component="Repl" data-prop-id="92647d0aa8d94aae84e70e374405233d"> 
</div>

# Route Transitions

This same technique can be used to facilitate transitions between routes in a single-page application. Here's an example using the [tinro](https://github.com/AlexxNB/tinro) router.

Note: I wrote this long ago, and nowadays it's better to use the browser's [View Transitions
API](https://developer.chrome.com/docs/web-platform/view-transitions/).

```svelte
<script>
  import { Route } from 'tinro';
  import { fade } from 'svelte/transition';
</script>
<style>
  #app {
    display: grid;
    height: 100%;
    width: 100%;
    overflow: auto;
    grid-template:
      "nav" 3rem
      "main" 1fr
      / auto;
  }

  nav {
    grid-area: nav;
  }

  main {
    grid-area: main;
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  /* use :global since the Route element may be in another component */
  main > :global(*) {
    grid-row: 1;
    grid-column: 1;
  }
</style>

<div id="app">
<nav>Nav Bar</nav>
<main>
  <Route path="/">
    <div transition:fade>page</div>
  </Route>

  <Route path="/:post" let:meta>
    {#key meta.match}
      <div transition:fly={{ x: 200 }}>{meta.params.post}</div>
    {/key}
  </Route>
</main>
</div>
```


I'll cover more advanced transition techniques in future posts. Thanks for reading!
