<script>
  import {
    createEventDispatcher,
    getContext,
    setContext,
    onDestroy,
  } from 'svelte';

  import L from 'leaflet';
  import flush from 'just-flush';
  export let latLngs;
  export let color;
  export let weight = undefined;
  export let opacity = undefined;
  export let pane = undefined;
  export let lineCap = undefined;
  export let lineJoin = undefined;
  export let fill = undefined;
  export let fillColor = undefined;
  export let className = undefined;
  export let dashArray = undefined;
  export let dashOffset = undefined;
  export let fillOpacity = undefined;
  export let fillRule = undefined;
  export let interactive = true;
  export let style = undefined;

  const dispatch = createEventDispatcher();

  let layerPane = pane || getContext('pane');
  let layerGroup = getContext('layerGroup')();

  export let line = new L.Polyline(
    latLngs,
    flush({
      interactive,
      className,
      pane: layerPane,
    })
  )
    .on('click', (e) => dispatch('click', e))
    .on('mouseover', (e) => dispatch('mouseover', e))
    .on('mouseout', (e) => dispatch('mouseout', e))
    .addTo(layerGroup);

  setContext('layer', () => line);

  $: lineStyle = flush({
    color,
    className,
    weight,
    opacity,
    dashArray,
    dashOffset,
    lineCap,
    lineJoin,
    fill,
    fillColor,
    fillOpacity,
    fillRule,
  });
  onDestroy(() => {
    line.remove();
    line = undefined;
  });

  $: if (style) {
    line.getElement()?.setAttribute('style', style);
  }

  $: line.setStyle(lineStyle);

  $: {
    line.setLatLngs(latLngs);
    line.redraw();
  }
</script>

<slot />
