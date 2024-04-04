<script>
  import { fade, crossfade } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  const incoming = new Map();
  const outgoing = new Map();

  let messages = [];

  let msgIndex = 0;
  function addMessage(description, key, msg) {
    messages.unshift(`${msgIndex++} ${description} "${key}": ${msg}`);
    messages = messages;
  }

  function coordinatedTransition(myNode, otherRect, options) {
    // crossFade gets the bounding rect of both nodes and tweens between them here.
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
      },
    };
  }

  function makeCrossfade(description, node, params, mine, other) {
    // Add our node to the Map.
    addMessage(description, params.key, 'initializing');
    mine.set(params.key, node.getBoundingClientRect());
    return function run() {
      addMessage(description, params.key, 'starting transition');
      // Now all the nodes have initialized.
      // See if there is another node transitioning with the same key.
      let matchingRect = other.get(params.key);
      // Clean up. We don't delete our own entry because we don't know if the other side has used it yet.
      other.delete(params.key);

      if (matchingRect) {
        addMessage(description, params.key, 'creating coordinated transition');
        // We have a matching pair, so transition them together.
        return coordinatedTransition(node, matchingRect, params);
      } else {
        addMessage(description, params.key, 'no matching element');
        // No matching element for this one, so do something else. Crossfade calls this the fallback.
        mine.delete(params.key);
        return fade(node, params);
      }
    };
  }

  const [inTransition, outTransition] = [
    (node, params) =>
      makeCrossfade('incoming', node, params, incoming, outgoing),
    (node, params) =>
      makeCrossfade('outgoing', node, params, outgoing, incoming),
  ];

  function move(sectionIndex, sectionDelta, itemIndex) {
    let nextSection = sections[sectionIndex + sectionDelta];
    let thisSection = sections[sectionIndex];
    nextSection.items = [...nextSection.items, thisSection.items[itemIndex]];
    nextSection.items.sort((a, b) => a.localeCompare(b));
    thisSection.items = thisSection.items.filter((_, i) => i != itemIndex);
    sections = sections;
  }

  let sections = [
    {
      name: 'Queued',
      items: ['Download Node', 'Eat', 'Install Svelte'],
    },
    {
      name: 'In Progress',
      items: [],
    },
    {
      name: 'Done',
      items: ['Wake Up'],
    },
  ];
</script>

<link
  href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
  rel="stylesheet" />

<main class="mt-8 flex h-96 space-x-4">
  {#each sections as section, sectionIndex}
    <section class="flex flex-1 flex-col border bg-gray-50 p-2 pt-0">
      <h2 class="mb-4 text-center font-medium text-gray-900">
        {section.name}
      </h2>

      <div class="flex flex-col space-y-4">
        {#each section.items as item, itemIndex (item)}
          <div
            in:inTransition|global={{ key: item }}
            out:outTransition|global={{ key: item }}
            animate:flip={{ duration: 300 }}
            class="bg-white px-2 py-4 shadow-xl">
            <div class="text-center text-sm font-medium text-gray-800">
              {item}
            </div>

            <div class="mt-2 flex w-full justify-around">
              <button
                class="w-12 bg-gray-50 hover:bg-gray-100"
                disabled={sectionIndex == 0}
                type="button"
                on:click={() => move(sectionIndex, -1, itemIndex)}>
                &lt;
              </button>

              <button
                class="w-12 bg-gray-50 hover:bg-gray-100"
                disabled={sectionIndex == sections.length - 1}
                type="button"
                on:click={() => move(sectionIndex, 1, itemIndex)}>
                &gt;
              </button>
            </div>
          </div>
        {/each}
        <div />
      </div>
    </section>
  {/each}
</main>

<p class="mt-4">Transition Events, in reverse order</p>
<select multiple class="h-64 w-full">
  {#each messages as msg}
    <option>{msg}</option>
  {/each}
</select>

<style>
  :global(*) {
    position: relative;
  }
</style>
