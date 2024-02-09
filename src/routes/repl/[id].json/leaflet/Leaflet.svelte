<script>
  import { createEventDispatcher, setContext } from 'svelte';
  import L from 'leaflet';
  // Uncomment this for use outside the REPL
  //import 'leaflet/dist/leaflet.css';
  export let height = '100%';
  export let width = '100%';

  // Must set either bounds, or view and zoom.
  export let bounds = undefined;
  export let view = undefined;
  export let zoom = undefined;
  let mapProp = undefined;
  export { mapProp as map };

  export const invalidateSize = () => map?.invalidateSize();

  const dispatch = createEventDispatcher();

  let map;
  $: mapProp = map;

  export const getMap = () => map;
  setContext('layerGroup', getMap);
  setContext('layer', getMap);
  setContext('map', getMap);

  function createLeaflet(node) {
    map = L.map(node).on('zoom', (e) => dispatch('zoom', e));
    if (bounds) {
      map.fitBounds(bounds);
    } else {
      map.setView(view, zoom);
    }

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: `&copy;<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>,
          &copy;<a href="https://carto.com/attributions" target="_blank">CARTO</a>`,
        subdomains: 'abcd',
        maxZoom: 14,
      }
    ).addTo(map);

    return {
      destroy() {
        map.remove();
        map = undefined;
      },
    };
  }

  $: if (map) {
    if (bounds) {
      map.fitBounds(bounds);
    } else {
      map.setView(view, zoom);
    }
  }
</script>

<div style="height:{height};width:{width}" use:createLeaflet>
  {#if map}
    <slot {map} />
  {/if}
</div>

<style>
  :global(.leaflet-control-container) {
    position: static;
  }
</style>
