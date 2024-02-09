<script>
  /*
		Thanks for checking this out! This is a demo of github.com/dimfeld/svelte-zoomable. 
		Also see the flex layout example at https://svelte.dev/repl/58dfe87756ee4db897c281b52fdef7b7?version=3.31.0
		And if you have any questions or comments, feel free to ping me at @dimfeld on Twitter. 
	*/

  import { zoomPresets as presets } from 'svelte-zoomable@0.0.5';
  import ZoomGrid from './ZoomGrid.svelte';
  import { writable } from 'svelte/store';

  let zoomPresetId = 'mergeSiblingsParallel';
  const zoomPresetIds = {
    mergeSiblingsParallel: 'Sibling Merge',
    crossfade: 'Crossfade',
    fade: 'Simple Fade',
    zoomExperimental: 'Experimental WIP Zoom',
  };

  $: zoomPreset = presets[zoomPresetId];
  let zoomManager = writable(null);
</script>

<div id="app">
  <header>
    <label>
      <span>Choose a Zoom Preset</span>
      <select bind:value={zoomPresetId}>
        {#each Object.entries(zoomPresetIds) as [id, label]}
          <option value={id}>{label}</option>
        {/each}
      </select>
    </label>
  </header>

  <main>
    <ZoomGrid {zoomPreset} />
  </main>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
    position: relative;
  }

  #app {
    width: 100%;
    display: grid;
    grid-template-rows: 3rem 1fr;
    font-family: sans-serif;
  }

  header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    padding: 1rem 0.5rem;
  }

  main {
    place-self: stretch;
    margin: 0px 1rem 1rem;
  }
</style>
