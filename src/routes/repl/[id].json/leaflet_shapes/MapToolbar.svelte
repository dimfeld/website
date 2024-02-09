<script>
  import { createEventDispatcher } from 'svelte';
  export let arrowSideLength;
  export let arrowSideAngle;
  export let minArrowSpacing;

  const dispatch = createEventDispatcher();
</script>

<!-- 
This mousedown handler prevents Leaflet from scrolling the
map while we are moving the range slider.
-->
<div on:mousedown|stopPropagation={() => {}}>
  <label>
    <span>Arrow Side Length {arrowSideLength}</span>
    <input
      type="range"
      bind:value={arrowSideLength}
      min="5"
      on:input={(e) => dispatch('arrowSideLength', e.target.valueAsNumber)} />
  </label>

  <label>
    <span>Arrow Spacing {minArrowSpacing}</span>
    <input
      type="range"
      bind:value={minArrowSpacing}
      min="20"
      max="500"
      step="1"
      on:input={(e) => dispatch('minArrowSpacing', e.target.valueAsNumber)} />
  </label>

  <label>
    <span>Arrow Side Angle PI / {arrowSideAngle}</span>
    <input
      type="range"
      min="1"
      max="16"
      step="2"
      bind:value={arrowSideAngle}
      on:input={(e) => dispatch('arrowSideAngle', e.target.valueAsNumber)} />
  </label>
</div>

<style>
  div {
    background-color: rgba(180, 180, 180, 0.5);
    padding: 0.5rem;
    border-radius: 0.5rem;
  }

  label {
    display: flex;
    justify-content: space-between;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
  }

  span {
    width: 9rem;
    font-weight: 500;
  }
  input {
    width: 12rem;
  }
</style>
