---
title: Coordinating Multiple Elements with Svelte Deferred Transitions
date: 2021-01-31
tags: Svelte
cardImage: svelte_deferred_transitions_card.png
cardImageFilter: opacity(80%) brightness(155%) saturation(200%)
---

In this blog series I’m going to talk about how I implemented some complex transitions for the [svelte-zoomable](https://github.com/dimfeld/svelte-zoomable) experiment.

Most Svelte transitions are a simple affair. You put something like `transition:fade` on an element to fade it in and out, or use separate `in:` and `out:` directives to customize the behavior in each direction.

But sometimes we have multiple elements entering and leaving at the same time, and we want the appearance of a single transition involving them all. This is where deferred transitions come into play.

# Crossfade

Svelte comes built-in with a single deferred transition, called `crossfade`. The [Svelte tutorial](https://svelte.dev/tutorial/deferred-transitions) uses `crossfade` to remove an item from one list and add it to another, with the effect of the element moving smoothly between them.

To accomplish this,  `crossfade` returns a pair of functions, conventionally called `send` and `receive` (though this is mostly due to the details of the tutorial example).

```html
<script>
  import { crossfade } from ‘svelte/transition’;
  const [send, receive] = crossfade();

  let complete = [...];
  let incomplete = [...];
</script>

<ul>
{#each incomplete as item}
  <li in:receive={{ key: item.id }} out:send={{ key: item.id }}>
    {item.name}
  </li>
{/each}
</ul>

<ul>
{#each complete as item}
  <li in:receive={{ key: item.id }} out:send={{ key: item.id }}>
    {item.name}
  </li>
{/each}
</ul>
```

So in this example, when an item switches between the lists, the incoming element “receives” what is “sent” by the outgoing element. Each call to one of the crossfade functions passes it the ID of the element.

Internally, `crossfade` maintains a list of all the keys, and when an element starts to transition, it looks to see if there is another element with the same ID transitioning in the opposite direction. If so, then the elements crossfade with each other.

# Implementing a Transition

A normal transition is just a function that returns a structure informing Svelte how to build the transition. Here is a very simple example that slides an element in and out to the right.

```javascript
import { cubicOut } from ‘svelte/easing’;
function horzSlideTransition(node, { duration }) {
  return {
    duration,
    easing: cubicOut,
    css: (t, u) => {
      // Slide in from the right.
      return `transform: translateX(${u * 100}%)`;
    },
  };
}
```

The returned data structure is fully described in [the Svelte documentation](https://svelte.dev/docs#Custom_transition_functions), but the main item of interest here is the `css` function. Svelte calls this function multiple times to build up keyframes for the animation, and the value of `t` ranges from 0 to 1, where 0 is the start and 1 is the end. The `u` argument is just `1 - t` and is provided for convenience. In general, `u` is most useful for movement-based styles, where you want the element to start at 100% of the movement (farthest away) and transition to its final place at 0%.

Svelte has one more trick here, which is that when an element is transitioning out it automatically runs your transition backwards, so that you don’t have to do anything special to handle both directions.

# Deferred Transitions

This is nice and easy, but it doesn’t give us any opportunities for coordination like `crossfade` uses. To allow this, Svelte provides the “deferred” transition. Instead of returning the transition data structure right away, a deferred transition returns a function, which then returns the data structure. When Svelte sees the function, it queues it up and calls it on the next tick, allowing other transitioning elements to set up their transitions too.

This is what the horizontal slide transition above looks like, when converted to a deferred transition.

```javascript
import { cubicOut } from ‘svelte/easing’;
function deferred(node, {duration}) {
  return function horzSlideTransition() {
    return {
      duration,
      easing: cubicOut,
      css: (t, u) => {
        // Slide in from the right.
        return `transform: translateX(${u * 100}%)`;
      },
    };
  }
}
```

Of course, this does exactly the same thing as the first example, so it’s not too useful.

# Coordinating multiple transitions

The real advantage of the deferred transition is that it gives us time for all the running transitions to add some data into a shared data structure. This example Is sort of what `crossfade` does, but massively simplified to explain it better.

<div data-component="Repl" data-prop-id="9708a375b4564f0a89105c743610fc10">

Check out this code running in the [Svelte REPL](https://svelte.dev/repl/9708a375b4564f0a89105c743610fc10?version=3.32.1).

```svelte
<script>
  import { fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  const incoming = new Map();
  const outgoing = new Map();

  function coordinatedTransition(myNode, otherRect, options) {
    // get the bounding rect of both nodes and tween between them here.
    // Svelte's crossfade does basically the same thing but a more thorough job.
    let myRect = myNode.getBoundingClientRect();

    const style = getComputedStyle(myNode);
    const transform = style.transform === 'none' ? '' : style.transform;

    let deltaX = otherRect.left - myRect.left;
    let deltaY = otherRect.top - myRect.top;
    return {
      duration: 300,
      css: (t, u) => {
        let x = deltaX * u;
        let y = deltaY * u;
        let style = `transform-origin:top left;
          transform: ${transform} translate(${x}px, ${y}px);
          opacity:${t}`;
        return style;
      }
    };
  }

  function makeCrossfade(node, params, mine, other) {
    // Add our node to the Map.
    mine.set(params.key, node.getBoundingClientRect());
    return function run() {
      // Now all the nodes have initialized.
      // See if there is another node transitioning with the same key.
      let matchingRect = other.get(params.key);
      // Clean up. We don't delete our own entry because we don't know if the other side has used it yet.
      other.delete(params.key);

      if(matchingRect) {
        // We have a matching pair, so transition them together.
        return coordinatedTransition(node, matchingRect, params);
      } else {
         // No matching element for this one, so do something else. Crossfade calls this the fallback.
        mine.delete(params.key);
        return fade(node, params);
      }
    }
  }

  const [inTransition, outTransition] = [
    (node, params) => makeCrossfade(node, params, incoming, outgoing),
    (node, params) => makeCrossfade(node, params, outgoing, incoming),
  ];

  function move(sectionIndex, sectionDelta, itemIndex) {
    let nextSection = sections[sectionIndex + sectionDelta];
    let thisSection = sections[sectionIndex];
    nextSection.items = [...nextSection.items, thisSection.items[itemIndex]];
    nextSection.items.sort((a, b) => a.localeCompare(b));
    thisSection.items = thisSection.items.filter((_, i) => i != itemIndex);
    sections = sections;
  }

  const sections = [
    {
      name: 'Queued',
      items: [
        'Download Node',
        'Eat',
        'Install Svelte',
      ],
    },
    {
      name: 'In Progress',
      items: [],
    },
    {
      name: 'Done',
      items: [
        'Wake Up'
      ],
    }
  ];
</script>

<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">

<main class="flex space-x-4 mt-8 h-96">
  {#each sections as section, sectionIndex}
    <section class="flex flex-col flex-1 border p-2 pt-0 bg-gray-50">
        <h2 class="text-center font-medium text-gray-900 mb-4">
          {section.name}
        </h2>

      <div class="flex flex-col space-y-4">
        {#each section.items as item, itemIndex (item)}
          <div in:inTransition={{ key: item }} out:outTransition={{ key: item }}
                animate:flip={{duration: 300 }} class="px-2 py-4 shadow-xl bg-white">
              <div class="font-medium text-sm text-gray-800 text-center">
                {item}
              </div>

              <div class="w-full flex justify-around mt-2">
                <button class="w-12 bg-gray-50 hover:bg-gray-100" disabled={sectionIndex == 0} type="button" on:click={() => move(sectionIndex, -1, itemIndex)}>
                  &lt;
                </button>

                <button class="w-12 bg-gray-50 hover:bg-gray-100"
                        disabled={sectionIndex == sections.length - 1}
                        type="button" on:click={() => move(sectionIndex, 1, itemIndex)}>
                  &gt;
                </button>
            </div>
          </div>
        {/each}
      <div>
    </section>
  {/each}
</main>

<style>
  :global(*) {
    position:relative;
  }
</style>

```

</div>

So this forms the basis of how to coordinate multiple elements with deferred transitions. In the next part of the series, we’ll look at additional techniques to coordinate more than two items together, and then finally we’ll dive into multi-part transitions.
