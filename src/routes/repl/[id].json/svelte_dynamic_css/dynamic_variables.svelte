<script>
  let styles = {
    'note-bg-color': '#f4ed2a',
    'note-color': '#FF5555',
    bg: '#AAAAAA',
  };

  $: cssVarStyles = Object.entries(styles)
    .map(([key, value]) => `--${key}:${value}`)
    .join(';');

  // Or just this is fine too.
  // let noteBgColor = '#f4ed2a';
  // let noteColor = '#FF5555';
  // $: cssVarStyles = `--note-color:${noteColor};--note-bg-color:${noteBgColor}`;
</script>

<div id="top" style={cssVarStyles}>
  <h1 class="note" style="font-weight:600">Some text!</h1>

  <p>
    But the variables we manually set below can still override the dynamic ones.
  </p>
  <div class="yellow-theme">
    <p class="note">For that yellow notepad look.</p>

    <p class="note purple-note-text">Or with purple</p>
  </div>

  <label>
    <input style="padding:0" type="color" bind:value={styles['note-color']} />
    Note Text Color
  </label>

  <label>
    <input
      style="padding:0"
      type="color"
      bind:value={styles['note-bg-color']} />
    Note Background Color
  </label>

  <label>
    <input style="padding:0" type="color" bind:value={styles['bg']} />
    Page Background Color
  </label>
</div>

<style>
  #top {
    background-color: var(--bg, lightgray);
    height: 100%;
  }

  .note {
    color: var(--note-color, tomato);
    background-color: var(--note-bg-color, lightgray);
  }

  .yellow-theme {
    --note-color: black;
    --note-bg-color: khaki;
  }

  .purple-note-text {
    --note-color: rebeccapurple;
  }
</style>
