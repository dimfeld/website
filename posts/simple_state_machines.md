---
title: Super Simple State Machines
date: 2020-05-13
summary: Fortifying component state with simple state machines
frontPageSummary: fortifying component state with simple state machines
status: Very confident.
---

When writing any sort of code that needs to maintain state, it's very easy for that state to grow into a morass of flags to represent various aspects.

We might start with a simple `loading` variable to track if a component has loaded its initial data and is ready to render. But later we need to know an error occurred. Oh, and if an asynchronous data fetch is taking place, and once external actions start applying (whether from direct user interaction or via API calls) that adds more to track.

If we're not careful, we end up with something like this:

```js
let loading = true;
let error = false;
let active = false;
let currentValue = null;
let data = [];
let dataIndex = 0;
let popupMenuOpen = false;
let popupMenuFocused = false;
```

While a few flags for tracking state may feel ok, as the code develops it starts to fill up with this sort of code:

```js
function handleKeyArrowDown() {
  if(loading || error) {
    return;
  }

  if(popupMenuOpen) {
    if(popupMenuFocused) {
      // If it's focused, go to the next item.
      selectedPopupIndex =
          Math.min(selectedPopupIndex + 1, data.length);
    } else {
      // Focus the menu and select the first item
      selectedPopupIndex = 0;
      popupMenuFocused = true;
    }
  } else {
    // Open the menu
    popupMenuOpen = true;
  }
}

```

This is a simple exaple, but as the code grows this quickly becomes a source for bugs. Tracking all these flags in your mind leads to a lot of possible states to consider, especially when coming back to it months later with little recollection of your thought processes.

Tests help, of course, but tests won't catch any edge cases we fail to consider, and as more boolean flags are added, more edge cases and invalid states appear too.

# Make Invalid States Unrepresentable

[Yaron Minksy of Jane Street Capital](https://blog.janestreet.com/effective-ml-revisited/) coined this phrase, and it is the guiding rule for converting the state from a bunch of booleans into something more succinct. If it's impossible for the code to get into an invalid state in the first place, then we don't have to worry about checking, testing, or handling it.

In the example above, it would never make sense for the popup menu to be focused but not open. So let's collapse those two booleans into a single variable.

```typescript
// In Typescript
enum PopupState {
  Closed,
  Open,
  Focused
}
let popupMenuState = PopupState.Closed;

// Or in plain Javascript:
const POPUP_MENU_CLOSED = Symbol('popupMenuClosed');
const POPUP_MENU_OPEN = Symbol('popupMenuOpen');
const POPUP_MENU_FOCUSED = Symbol('popupMenuFocused');
let popupMenuState = POPUP_MENU_CLOSED;
```

So instead of having two related boolean variables with a total of four states, we have one variable which can be in three states. There's no longer any need make sure that to avoid the state of `popupMenuFocused && !popupMenuOpen` because it's impossible for the code to event get into that state. The down arrow handler becomes:

```js
function handleKeyArrowDown() {
  if(loading || error) {
    return;
  }

  switch(popupMenuState) {
    case PopupState.Closed:
      popupMenuState = PopupState.Open;
      break;
    case PopupState.Open:
      popupMenuState = PopupState.Focused;
      selectedPopupIndex = 0;
      break;
    case PopupState.Focused:
      selectedPopupIndex =
          Math.min(selectedPopupIndex + 1, data.length);
      break;
  }
}
```

This is a very simple example, but it's already starting to look cleaner. Let's go further.

# Finite State Machines

Finite State Machines, or FSMs, are...

Brief history

Simple state transitions

Representing in Xstate






