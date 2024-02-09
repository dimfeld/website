<script>
  import ColorSetting from './ColorSetting.svelte';
</script>

<div>
  <h1 class="note" style="font-weight:600">
    Same as the last example, but applied on the HTML element
  </h1>

  <p>
    But the variables we manually set below can still override the dynamic ones.
  </p>
  <div class="yellow-theme">
    <p class="note">For that yellow notepad look.</p>

    <p class="note purple-note-text">Or with purple</p>
  </div>
</div>

<ColorSetting key="note-color" label="Note Text Color" value="#FF5555" />
<ColorSetting key="note-bg-color" label="Note BG Color" value="#f4ed2a" />
<ColorSetting key="bg" label="Page Background" value="#BBBBBB" />

<style>
  :root {
    background-color: var(--bg, lightgray);
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
