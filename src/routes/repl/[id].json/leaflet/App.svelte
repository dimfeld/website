<script>
  /*
		This is an example of using Renderless components to integrate Svelte with Leaflet. Original blog post here: https://imfeld.dev/writing/domless_svelte_component
		
	For comparison, the original REPL that implemented this without Renderless components is here: https://svelte.dev/repl/62271e8fda854e828f26d75625286bc3?version=3.29.7
	
	You can also find a full application implementing these techniques at https://github.com/dimfeld/svelte-leaflet-demo
	
	Any questions? Ask me at dimfeld on Twitter!
	
	Thanks to heroicons.dev for the icons used here.
	*/

  import L from 'leaflet';
  import Leaflet from './Leaflet.svelte';
  import Control from './Control.svelte';
  import Marker from './Marker.svelte';
  import Popup from './Popup.svelte';
  import Polyline from './Polyline.svelte';
  import MapToolbar from './MapToolbar.svelte';
  import { scaleSequential } from 'd3-scale';
  import { interpolateRainbow } from 'd3-scale-chromatic';
  let map;

  const markerLocations = [
    [29.8283, -96.5795],
    [37.8283, -90.5795],
    [43.8283, -102.5795],
    [48.4, -122.5795],
    [43.6, -79.5795],
    [36.8283, -100.5795],
    [38.4, -122.5795],
  ];

  const colors = scaleSequential(interpolateRainbow).domain([
    0,
    markerLocations.length - 1,
  ]);
  const lines = markerLocations.slice(1).map((latLng, i) => {
    let prev = markerLocations[i];
    return {
      latLngs: [prev, latLng],
      color: colors(i),
    };
  });

  const initialView = [39.8283, -98.5795];

  let eye = true;
  let showLines = true;

  function resizeMap() {
    if (map) {
      map.invalidateSize();
    }
  }

  function resetMapView() {
    map.setView(initialView, 5);
  }
</script>

<svelte:window on:resize={resizeMap} />

<!-- Can just use an import statement for this, when outside the REPL -->
<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
  integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
  crossorigin="" />

<Leaflet bind:map view={initialView} zoom={4}>
  <Control position="topright">
    <MapToolbar bind:eye bind:lines={showLines} on:click-reset={resetMapView} />
  </Control>

  {#if eye}
    {#each markerLocations as latLng}
      <Marker {latLng} width={30} height={30}>
        <svg
          style="width:30px;height:30px"
          fill="none"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>

        <Popup>A popup!</Popup>
      </Marker>
    {/each}
  {/if}

  {#if showLines}
    {#each lines as { latLngs, color }}
      <Polyline {latLngs} {color} opacity={0.5} />
    {/each}
  {/if}
</Leaflet>
