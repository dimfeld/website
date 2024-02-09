<!-- Although the note class applies to all the child elements, setting
the CSS variables in child elements does not apply unless we reapply the note class again. -->
<div class="note" style="--note-color:green;--note-bg-color:tomato">
  <h1 style="font-weight:600">Christmas!</h1>

  <div class="yellow-theme">
    <p>For that yellow notepad look.</p>

    <p class="purple-note-text" style="--note-bg-color:white">Or with purple</p>
  </div>
</div>

<style>
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
