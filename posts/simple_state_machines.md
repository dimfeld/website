---
title: Super Simple State Machines
date: 2020-05-13
summary: Fortifying component state with simple state machines
frontPageSummary: fortifying component state with simple state machines
status: I've implemented state matchines in various forms over the past couple of decades.
---

When writing any sort of stateful code, it's very easy to end up with a tangle of variables that represent various aspects. This happens especially when adding additional functionality into a component.

We might start with a simple `loading` variable to track if a component has loaded its initial data and is ready to render. But later we need to flag if an error occurred. And then, if an asynchronous data fetch is taking place, and once external actions start applying (whether from direct user interaction or via API calls) that adds more to track.

If we're not careful, we end up with a huge number of variables that flag different aspects of the state, many of which should be mutually exclusive. We have to take care to check and manage each flag, and make sure that we don't unintentionally set them into an invalid state.

I’ll cover more complex examples in later articles, but here’s a simple one I worked with recently. I have a small dialog box that tracks the progress of a video encoding task. It shows the progress of the video encoding, handles errors, and allows cancelling the process.

This state might be modeled with a few different boolean variables, some event handlers, and . I'm using [Svelte](https://svelte.dev) and skipping boilerplate, but the syntax should be readily familiar even if you haven't worked with it before.

```js
let started = false;
let error = false;
let cancelling = false;
let done = false;

let errorMessage = null;
let progress = { percent: 0, fps: 0 };

encoder.on('encode-progress', (data) => progress = data);
encoder.on('encode-start', () => started = true);
encoder.on('encode-end', () => {
  if(cancelling) {
    closeDialog();
  }
  done = true;
});
encoder.on('encode-error', (message) => {
  errorMessage = message;
  error = true;
});
```

Then some simple UI. I haven't made it look nice yet as of this writing, but here's what it looks like right now.

![Encoding Dialog](encoding-dialog.png)

We have a label at the top, a progress bar, and a button.

```html
<div>{label}</div>
{#if showProgress}
<progress max="100" value={progress.percent}>{progress.percent}%</progress>
{/if}
<button on:click|once={handleButton}>{buttonText}</button>

<script>
let label;
let buttonText;
// $: tells Svelte to rerun when the variables change.
$: showProgress = started && !(done || error);
$: {
  if(error) {
    label = 'Failed: ' + errorMessage;
  } else if(done) {
    label = 'Done!';
  } else if(started) {
    label = `Encoded ${progress.percent}% at ${progress.fps} FPS`;
  } else {
    label = 'Starting...';
  }

  if(done || error) {
    buttonText = 'Close';
  } else if(cancelling) {
    buttonText = 'Cancelling...';
  } else {
    buttonText = 'Cancel';
  }
}

function handleButton() {
  if(done || error) {
    closeDialog();
  } else if(!cancelling) {
    encoder.cancel();
    cancelling = true;
  }
}
</script>
```

This is a very simple example, but as the code grows this can quickly become a source for bugs. At each step, we have to consider all of the flags, and moreover they have to be checked in the correct order.

Tests help, of course, but tests won't catch any edge cases we fail to consider, and as more boolean flags are added, more edge cases and invalid states appear too.

# Make Invalid States Unrepresentable

[Yaron Minksy of Jane Street Capital](https://blog.janestreet.com/effective-ml-revisited/) coined this phrase, and it is the guiding rule for converting the state from a bunch of booleans into something more succinct. If it's impossible for the code to get into an invalid state in the first place, then we don't have to worry about checking, testing, or handling it.

We have four related boolean variables with a total of sixteen potential combinations. Let's reduce this to just one variable with five states.

```js
const WAITING_TO_START = 0, ENCODING = 1, CANCELLING = 2, DONE = 3, ERROR = 4;
let state = WAITING_TO_START;
encoder.on('encode-progress', (data) => (progress = data));
encoder.on('encode-start', () => (state = ENCODING));
encoder.on('encode-end', () => {
  if(state === CANCELLING) {
    closeDialog();
  }
  state = DONE;
});
encoder.on('encode-error', (message) => {
  errorMessage = message;
  state = ERROR;
});

```

Not much change there so far, but we'll improve more this later. Let's look at the UI code.

```js
$: showProgress = state === ENCODING;
$: switch(state) {
  case WAITING_TO_START:
    label = 'Starting...';
    buttonText = 'Close';
    break;
  case ENCODING:
    label = `Encoded ${progress.percent}% at ${progress.fps} FPS`;
    buttonText = 'Cancel';
    break;
  case CANCELLING:
    label = '';
    buttonText = 'Cancelling...';
    break;
  case DONE:
    label = `Done!`;
    buttonText = 'Close';
    break;
  case ERROR:
    label = 'Failed: ' + errorMessage;
    buttonText = 'Close';
    break;
}

function handleButton() {
  switch(state) {
    case WAITING_TO_START:
    case ENCODING:
      encoder.cancel();
      state = CANCELLING;
      break;
    case DONE:
    case ERROR:
      closeDialog();
      break;
  }
}
```


Now it’s easy to follow both the code and the reasoning behind it. There’s no longer any need to check different combinations of variables or to be sensitive to the order in which we check them. We just look at `state` to determine what to do.

# Control Transitions



# Finite State Machines

Finite State Machines, or FSMs, are...

Brief history

Simple state transitions

Representing in Xstate






