<script>
  /*
	This is an example of making shapes that remain the same size regardless of zoom in a Leaflet map.
	Original blog post here: https://imfeld.dev/writing/leaflet_shapes
		
	Any questions? Ask me at dimfeld on Twitter!
	
	Thanks to heroicons.dev for the icons used here.
	*/

  import L from 'leaflet';
  import MapToolbar from './MapToolbar.svelte';
  import makeLineCoordinates from './shapes';
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

  // Length of the sides of the arrow
  let arrowSideLength = 30;
  // The angle of the arrow sides from the tip
  let arrowSideAngle = 8;
  // How far apart to space multiple arrows.
  let minArrowSpacing = 250;

  $: arrowParams = {
    arrowSideLength,
    arrowSideAngle: Math.PI / arrowSideAngle,
    minArrowSpacing,
  };

  const initialView = [39.8283, -98.5795];
  function createMap(container) {
    let m = L.map(container, { preferCanvas: true }).setView(initialView, 5);
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

  let markers = new Map();

  function markerIcon(count) {
    let html = `<div class="map-marker"><div><svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg></div><div class="marker-text">${count}</div></div>`;
    return L.divIcon({
      html,
      className: 'map-marker',
    });
  }

  function createMarker(loc) {
    let count = Math.ceil(Math.random() * 25);
    let icon = markerIcon(count);
    let marker = L.marker(loc, { icon });
    return marker;
  }

  const lineColor = 'limegreen';
  let lines = [];
  function createLines() {
    for (let i = 1; i < markerLocations.length; ++i) {
      let from = markerLocations[i - 1];
      let to = markerLocations[i];

      let calcLine = makeLineCoordinates(map, from, to);
      let path = calcLine(arrowParams);
      let line = L.polyline(path.line, { color: lineColor });
      let arrow = L.polyline(path.arrow, {
        color: lineColor,
        fill: lineColor,
        fillOpacity: 1,
      });

      line.addTo(map);
      arrow.addTo(map);

      lines.push({ line, arrow, calcLine });
    }
  }

  function recalculateArrows() {
    for (let line of lines) {
      let path = line.calcLine(arrowParams);
      line.arrow.setLatLngs(path.arrow);
      line.arrow.redraw();
    }
  }

  $: arrowParams, recalculateArrows();

  let toolbar = L.control({ position: 'topright' });
  let toolbarComponent;
  toolbar.onAdd = (map) => {
    let div = L.DomUtil.create('div');
    toolbarComponent = new MapToolbar({
      target: div,
      props: {
        arrowSideLength,
        minArrowSpacing,
        arrowSideAngle,
      },
    });

    toolbarComponent.$on(
      'arrowSideLength',
      ({ detail }) => (arrowSideLength = detail)
    );
    toolbarComponent.$on(
      'arrowSideAngle',
      ({ detail }) => (arrowSideAngle = detail)
    );
    toolbarComponent.$on(
      'minArrowSpacing',
      ({ detail }) => (minArrowSpacing = detail)
    );

    return div;
  };

  toolbar.onRemove = () => {
    if (toolbarComponent) {
      toolbarComponent.$destroy();
      toolbarComponent = null;
    }
  };

  function mapAction(container) {
    map = createMap(container);
    toolbar.addTo(map);

    for (let location of markerLocations) {
      let m = createMarker(location);
      m.addTo(map);
    }

    createLines();

    map.on('zoom', recalculateArrows);

    return {
      destroy: () => {
        toolbar.remove();
        map.remove();
        map = null;
      },
    };
  }

  function resizeMap() {
    if (map) {
      map.invalidateSize();
    }
  }
</script>

<svelte:window on:resize={resizeMap} />

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
  integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
  crossorigin="" />
<div class="map" style="height:100%;width:100%" use:mapAction />

<style>
  .map :global(.marker-text) {
    width: 100%;
    text-align: center;
    font-weight: 600;
    background-color: #444;
    color: #eee;
    border-radius: 0.5rem;
  }

  .map :global(.map-marker) {
    width: 30px;
    transform: translateX(-50%) translateY(-25%);
  }
</style>
