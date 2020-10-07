---
title: Interactive Maps with Leaflet and Svelte
date: 2020-07-16
tags: Svelte
cardImage: leaflet_with_svelte_card.png
cardImageFilter: saturate(200%)
---

Leaflet is a popular Javascript library for interactive maps. Its API has a lot of features for making nice-looking and useful maps, but with some smart patterns in Svelte you can add extra interactivity to your maps without needing to step outside Svelte’s component model.

This isn't intended to be a full tutorial on Leaflet, just a set of techniques for using it better with Svelte. The [Leaflet Tutorials](https://leafletjs.com/examples.html) have a lot of other useful things you can do.

![Interactive popups in Leaflet](leaflet-popups.gif)

I've also put together a [Svelte REPL example](https://svelte.dev/repl/62271e8fda854e828f26d75625286bc3?version=3.24.0) where you can see these techniques in action, or you can scroll to the bottom of the page to see it if you're on the website.

# Creating the Map

Nothing too special here. Just create the map in `onMount` or a `use:` action with the standard Leaflet functions.

```svelte
<script>
  import * as L from 'leaflet';
  // If you're playing with this in the Svelte REPL, import the CSS using the
  // syntax in svelte:head instead. For normal development, this is better.
  import 'leaflet/dist/leaflet.css';
  let map;

  function createMap(container) {
    let m = L.map(container).setView([51.505, -0.09], 13);
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
          &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
        subdomains: 'abcd',
        maxZoom: 14,
      }
    ).addTo(m);

    return m;
  }

  function mapAction(container) {
    map = createMap(container);
    return {
      destroy: () => {
        map.remove();
      },
    };
  }
</script>

<svelte:head>
   <!-- In the REPL you need to do this. In a normal Svelte app, use a CSS Rollup plugin and import it from the leaflet package. -->
   <link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
   integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
   crossorigin=""/>
</svelte:head>

<div style="height:400px;width:100%" use:mapAction />
```

# Resizing the Map

When the document resizes, Leaflet does not automatically handle the change in size, so you may see gray areas where tiles need to be loaded. You can call `map.invalidateSize()` to tell Leaflet to update itself.

In Svelte, just listen for the `resize` event using `svelte:window`.

```svelte
<script>
  function resizeMap() {
    if(map) { map.invalidateSize(); }
  }
</script>
<svelte:window on:resize={resizeMap} />
```

# Svelte Components as Map Elements

## Popups

Most of the Leaflet example code for popups just passes HTML strings for the contents. But with a bit of component management we can use Svelte inside the popups too.

The simple trick here is to pass a function to `popup.setContent` or `marker.bindPopup`. This function can create a `div` and then instantiate the component inside the `div` element using the component client API.

```js
// Create a popup with a Svelte component inside it and handle removal when the popup is torn down.
// `createFn` will be called whenever the popup is being created, and should create and return the component.
function bindPopup(marker, createFn) {
  let popupComponent;
  marker.bindPopup(() => {
    let container = L.DomUtil.create('div');
    popupComponent = createFn(container);
    return container;
  });

  marker.on('popupclose', () => {
    if(popupComponent) {
      let old = popupComponent;
      popupComponent = null;
      // Wait for the popup to completely fade out before destroying it.
      // Otherwise the fade out looks weird as the contents disappear too early.
      setTimeout(() => {
        old.$destroy();
      }, 500);

    }
  });
}

let marker = L.marker([lat, lon], { icon });
bindPopup(marker, (container) => {
  let c = new PopupComponent({
    target: container,
    props: {
      ...theProps
    }
  });

  // Handle events from the popup
  c.$on('button-click', handleTheEvent);
  return c;
});
```

You can do something very similar with Leaflet’s `DivIcon` layer type to make icons that render via Svelte components. Just use `L.DomUtil.create` to make a `div` element, put the Svelte component inside it, and then pass the `div` to `L.divIcon({ html: div })`. I don't usually find this very useful to do though.

## Map Controls

Leaflet provides some built-in controls that sit on top of the map, but sometimes you may want a custom control such as a toolbar. Again, this is straightforward using the Svelte component API.

The `L.control` function returns a generic Leaflet control layer set up to handles the positioning for you. You then implement its `onAdd` and `onRemove` functions to set up the content and whatever functionality to interact with the toolbar.

This looks similar to the popup case, but control components are usually just created once, so I don’t bother to make a generic function for it like `bindPopup` above.

```js
let toolbar = L.control({ position: 'topright' });
let toolbarComponent;
toolbar.onAdd = (map) => {
  let div = L.DomUtil.create('div');
  toolbarComponent = new MapToolbar({
    target: div,
    props: {
      somePropToSetInTheToolbar,
    }
  });

  // Handle whatever events it exposes.
  toolbarComponent.$on('click-recenter-button', recenterMap);
  toolbarComponent.$on('click-toggle-button', toggleIt);

  return div;
}

toolbar.onRemove = () => {
  if(toolbarComponent) {
    toolbarComponent.$destroy();
    toolbarComponent = null;
  }
};

// If you want, sync some state to the toolbar as it changes.
$: if(toolbarComponent) {
  toolbarComponent.$set({
    somePropToSetInTheToolbar
  });
}

function mapAction(container) {
  // This is just like before, except we also add the toolbar
  // and then remove it in the destroy function.
  let map = createMap();
  toolbar.addTo(map);

  return {
    destroy: () => {
      toolbar.remove();
      map.remove();
    }
  };
}
```

## Syncing local state to the map through reactive statements

Sometimes you'll want to modify some state in a complicated way and update the map to match it. Reactive statements are a great solution for this.

```js
// A Map containing all the markers that we have created.
let markers = new Map();
let allLocations = {...};

// Create the markers.
for (let [id, data] of Object.entries(allLocations)) {
  let marker = L.marker(data.location, { icon: data.icon });
  markers.set(id, marker);
}

// Pretend this is a complicated set of logic to recalculate what is visible.
$: enabledIds = new Set(findRelationships(currentCity, activeCities));

function syncMarkers(markersMap, includedSet) {
  for (let [id, marker] of markersMap.entries()) {
    if (includedSet.has(id)) {
      map.addLayer(marker);
    } else {
      map.removeLayer(marker);
    }
  }
}

$: if(map) syncMarkers(markers, enabledIds);
```

In simple situations you can just call `addLayer` and `removeLayer` directly as you update the state, but with more complex state transitions it can help to maintain a set of enabled IDs and sync it to the map.

Leaflet does a good job of efficiently tracking which markers are on the map or not, and not doing extra work in addLayer or removeLayer if the marker is already in the desired state. So I don't usually put any extra effort into tracking which layers have been added or removed.

With a large number of markers, you may need to do something more efficient here that doesn't iterate over all the markers.

```js
let oldEnabled = new Set();
$: if(map) {
  for (let id of oldEnabled) {
    if (!enabledIds.has(id)) {
      map.removeLayer(markers.get(id));
    }
  }

  for (let id of enabledIds) {
    if (!oldEnabled.has(id)) {
      map.addLayer(markers.get(id));
    }
  }

  oldEnabled = enabledIds;
}
```

 If you have enough markers on your map to require a technique like this, you may also want to look at something like [Leaflet marker clustering](https://github.com/Leaflet/Leaflet.markercluster).

I’ve just focused on a few specific things here, but there’s a lot more you can do with Leaflet. The [Leaflet Tutorials](https://leafletjs.com/examples.html) page is a great place to start!

<div data-component="Repl" data-prop-id="62271e8fda854e828f26d75625286bc3">

And once again, you can play around with a bunch of these techniques from this post in this [Svelte REPL example](https://svelte.dev/repl/62271e8fda854e828f26d75625286bc3?version=3.24.0).

</div>
