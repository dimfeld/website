---
title: "DOMless Components: The Best Way to use Svelte with Leaflet and Other Imperative APIs"
date: 2020-11-20
tags: Svelte
cardImage: leaflet_with_svelte_card.png
cardImageFilter: saturate(200%)
---

Previously I’ve written about using [Leaflet with Svelte](leaflet_with_svelte), and also about more generally [translating declarative state to imperative APIs](imperative_apis_and_declarative_state). Today I’m going to introduce another technique that makes this process much easier.

My older attempts at translating this state looked somewhat complex:

```javascript
// A Map containing all the lines that we have created.
let lines = new Map();
let allLocations = {...};

// Create the markers.
for (let [id, data] of Object.entries(allLines)) {
  let line = L.Polyline(data.latLngs, { color: data.color });
  lines.set(id, line);
}

// Pretend this is a complicated set of logic to recalculate what is visible.
$: enabledIds = new Set(findRelationships(currentCity, activeCities));
function syncLines(linesMap, includedSet) {
  for (let [id, line] of linesMap.entries()) {
    if (includedSet.has(id)) {
      map.addLayer(line);
    } else {
      map.removeLayer(line);
    }
  }
}
$: if(map) syncLines(lines, enabledIds);
```

At the time, I realized that this is similar to what Svelte's `#each` loop does to convert the *declarative* state of an array into the *imperative* "do stuff in the DOM and/or make components" code that the compiler generates.

But it was a couple of months ago that I realized I could take advantage of that. This is much easier:

```svelte
<script>
  $: lines = calculateLines(currentCity, activeCities);
</script>

<Leaflet>
  {#each lines as line}
    <Polyline latLngs={line.latLngs} color={line.color} />
  {/each}
</Leaflet>
```

In this example, Svelte does most of the hard work of figuring out when to create and destroy Leaflet elements like `Polyline`. This is unusual, since Svelte components normally spend most of their time managing DOM elements, while Leaflet's API instead interacts with the Leaflet map instance: `L.polyline(latLngs, { color }).addTo(map)`.

The good news is that there is no actual requirement for the component to create DOM elements at all. Instead, something like this works just fine to manage a `Polyline` within a Svelte component.

```svelte
<script lang="typescript">
import * as L from 'leaflet';
import { getContext, setContext, onDestroy } from 'svelte';

// 'map' is set by the parent Leaflet component, and returns the
// Leaflet map instance.
const map = getContext('map')();

export let latLngs;
export let color;

// Create the line when the component instantiates...
export let line: L.Polyline =
  new L.Polyline(latLngs, { color }).addTo(map);

// And remove the line when the component is torn down
onDestroy(() => line.remove());

// The real component would have all the relevant properties here.
$: style = { color };
// Update the line when styles change.
$: line.setStyle(style);

// Move the line as needed.
$: {
  line.setLatLngs(latLngs);
  line.redraw();
}
</script>

<slot />
```

And that’s the entire file. When the component is created, it calls the Leaflet API to create a Polyline, and when it is destroyed, it removes the line. This is somewhat less intuitive than a normal component, but all the complexity is wrapped inside a single component, so everything that uses it is then just instantiating `Polyline` components.

There’s no need to manually track lines anymore or figure out which state changes to propagate to Leaflet; Svelte does all the hard work instead.

Leaflet elements like popups, tooltips, and map controls are more complex, since they might create some DOM elements which are then placed inside the popup. But with a bit of care they’re also not too bad.

```svelte
<script lang="typescript">
  import * as L from 'leaflet';
  import { getContext } from 'svelte';
  export let popup: L.Popup | undefined = undefined;

  // There's a bit more complexity in the real file here to only
  // render the slot contents when the popup is showing. See the
  // Github link at the bottom for full details.
  const layer = getContext<() => L.Layer>('layer')();
  function createPopup(popupElement: HTMLElement) {
    popup = L.popup().setContent(popupElement);
    layer.bindPopup(popup);

    return {
      destroy() {
        layer.unbindPopup();
        popup.remove();
        popup = undefined;
      },
    };
  }
</script>

<div style="display:none">
  <div use:createPopup>
    <slot />
  </div>
</div>
```

The `div` elements in this component seem a bit redundant at first glance, but there is good reason for them. The popup element is removed from its original place in the DOM and transferred under the control of Leaflet.

When the component is destroyed, Svelte will try to detach the top-level DOM nodes of the component from their parent. But when the popup is not visible, the `popupContainer` node does not have a parent, and Svelte doesn’t check for this. So the top-level `div` here remains hidden, and serves only to prevent exceptions from being thrown when a component is being torn down.

So with all this in place and a few more components, we can do something like this:

```svelte
<Leaflet>
  {#each regions as region (region.id)}
    <GeoJson geojson={region.geojson} fill={region.color}>
      <Popup>
        <h2>{region.name}</h2>
        <RegionSummaryGraph bars={region.graphBars} />
      </Popup>
      <Tooltip contents={region.name} />
    </GeoJson>
  {/each}

  {#each lines as line (line.id)}
    <Polyline latLngs={line.latLngs} color={line.color} />
  {/each}
</Leaflet>
```

Whatever code we have around this to create lines and regions doesn’t need to know anything about the underlying APIs in use. It just creates and updates the `lines` and `regions` arrays, and the various components call the Leaflet APIs as they are created and destroyed.

This is not only more idiomatic from a Svelte point of view, but makes developing applications and reading the resulting code much easier too. And of course, this sort of technique is not just limited to Leaflet. It can streamline the integration of any complex imperative API.

If you found this interesting, you can see an entire demo application with more mapping components on [Github](https://github.com/dimfeld/svelte-leaflet-demo/) and also watch a [talk I gave](https://www.youtube.com/watch?v=-klB-EocorE&t=770s) about using these techniques to visualize geographic data with Svelte and Leaflet.
