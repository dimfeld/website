---
title: Super Simple State Machines
date: 2020-05-13
draft: true
summary: Fortifying component state with simple state machines
frontPageSummary: fortifying component state with simple state machines
status: Some CS/EE undergrad training, and I've implemented state matchines in various forms over the past couple of decades.
---

State management is a perennial problem in computer programming. As code becomes more complex, it's easy to end up with a tangle of variables and a huge number of combinations of values, some valid and some not. This can lead to bugs where  State machines are one method of keeping a component's state manageable, which reduces bugs, enhances testability, and makes later modifications easier.

In this series of articles, I'll start by building a simple state machine from scratch, and progressively introduce more features and ways to deal with state changes. Later in the series I'll cover the popular [XState](https://xstate.js.org/) library as well, which provides a lot of niceties for more complex implementations.

So let's start with a simple example. I have recently been writing a small [Electron application for trimming video files](https://github.com/dimfeld/video-trimmer-gui). One part of this application is a dialog box that tracks the progress of a video encoding task.

The dialog shows the progress of the video encoding, handles errors, and allows cancelling the process. Its state could be modeled with a few different boolean variables and some event handlers. The code samples here use [Svelte](https://svelte.dev) and skip some boilerplate and other mundane details, but the syntax should be readily familiar even if you haven't worked with it before.

One obvious way to represent the data involved in the dialog is by adding some event handlers on the encoder, and keeping track of what has happened so far.

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

Then some UI. I haven't made it look nice yet as of this writing, but here's what it looks like right now.

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
// $: tells Svelte to rerun this whenever the variables change.
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

Tests help, of course, but tests won't catch any edge cases we fail to consider, and as more flags are added, more edge cases and invalid states appear too.

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

Not much change there so far, but we'll improve more this later. Let's look at the UI functions.

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

# Controlling State Transitions

One wrinkle with this change is that there's no control over how we transition between states. If the dialog receives an `encode-error` event, it will enter the `ERROR` state, but if the encoder then sends an `encode-end` event, the dialog enters the `DONE` state and the error message disappears. The user might not even know an error occurred and then wonder why the output video file isn't there.

Fortunately, we can control the transitions between states by listing what the next state should be for each event that happens.

```js
const transitions = {
  WAITING_TO_START: {
    'encode-error': ERROR,
    'encode-start': ENCODING,
    'encode-cancel': CANCELLING,
  },
  ENCODING: {
    'encode-error': ERROR,
    'encode-end': DONE,
    'encode-cancel': CANCELLING,
  },
  CANCELLING: {},
  DONE: {
    'encode-error': ERROR,
  },
  ERROR: {}
}

function stepState(event) {
  let nextStates = transitions[state];
  let nextState = nextStates[event];
  if(nextState) {
    state = nextState;
  }
}
```

If we're in the `ENCODING` state and receive an `encode-error` event, we go into the `ERROR` state. The `ERROR` state lists no events, which means that once we end up there, nothing can make it leave. Receiving an `encode-done` event will keep the state machine at `ERROR`, and so there's no need to worry or have other special logic to make sure that we don't inadvertently switch into an undesired state.

With this data structure in place and the function to handle the events, we alter the code to use `stepState` instead of setting the state directly.

```js
encoder.on('encode-progress', (data) => (progress = data));
encoder.on('encode-start', () => stepState('encode-start'));
encoder.on('encode-end', () => {
  if(state === CANCELLING) {
    closeDialog();
  }
  stepState('encode-end');
});
encoder.on('encode-error', (message) => {
  errorMessage = message;
  stepState('encode-error');
});

function handleButton() {
  switch(state) {
    case WAITING_TO_START:
    case ENCODING:
      encoder.cancel();
      stepState('encode-cancel');
      break;
    case DONE:
    case ERROR:
      closeDialog();
      break;
  }
}
```

Not a huge change in the code, but it adds a lot of robustness. This code doesn't have to adapt to changes in how the events arrive, and any potential bugs are completely prevented. What we have now, a list of states and a set of transitions between them, sets up the bare minimum of a "Finite State Machine."

One remaining messy part is in the interaction with the outside world. The code still manually checks when to call `encoder.cancel` or `closeDialog`, and it would be nice to automate these calls as we move through the state machine. In part 2 of this series, I'll touch on a bit of state machine theory, and in doing so set up the ability to handle these cases nicely.
