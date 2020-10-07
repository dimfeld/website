---
title: Managing Nested Popups in Svelte
date: 2020-10-06
tags: Svelte
cardImage: nested-popups.png
cardImageFilter: opacity(80%) brightness(155%) saturation(200%)
---

As I have written and designed more frontend code, I've become fond of using small popups instead of modal dialogs when there are only a few controls to show. This design tactic places the new interactions near the same place that the user is currently looking at, and interrupts the flow less than popping up an entire dialog when the interaction might just be one or two clicks.

![](nested-popups.png)

One thing that we want for these popups is that they should close when the user clicks anywhere outside the popup. This behavior, commonly referred to as "close on click outside," is usually simple to implement, but it can become tricky  when certain requirements intersect. I've developed a relatively easy method for handling the tricky behavior, so let's have a look!

# Basic Close On Click Outside Implementation

This is pretty straightforward. When the popup is open, we listen for clicks on the entire document and close the dropdown if the click is not inside the popup. Here I use a Svelte action to add and remove the click listener as needed.

```svelte
<script>
    let open = false;
    function closeOnClickOutside(node) {
      const handleClick = (event) => {
        if(!node.contains(event.target)) {
          open = false;
          // If you want to prevent the outside click from doing anything else.
          event.stopImmediatePropagation();
        }
      };

      document.addEventListener('click', handleClick, { capture: true });
      return {
        destroy() {
          document.removeEventListener(
              'click',
              handleClick,
              { capture: true }
            );
        }
      }
    }
</script>

<button type="button" on:click={() => (open = !open)}>Open Dropdown</button>
{#if open}
  <!-- I usually use something like Tippy for any nontrivial
       popup management. The example at the end demonstrates this. -->
  <div class="popup" style="position:absolute" use:closeOnClickOutside>
    Popup Menu
  </div>
{/if}
```

# Common Additional Requirements

While the above example works for the simplest cases, sometimes we need more complex behavior.

## Nested Popups

Putting one dropdown inside another is usually a bad idea, but in some cases it can actually simplify the flow compared to modal dialogs.

![](nested-popups.png)

In this example, clicking the List Actions button brings up a menu popup, and clicking "Delete this List" brings up another popup to confirm the deletion. Because the "Delete" popup is contained in the DOM tree of the "List Actions" popup, the click detection works properly.

## Hoisting Dropdowns in the DOM

When possible, it's convenient to just attach the popup menu to the element that creates it, like in the example above. But many applications trigger popups from elements with clipped or scrolling overflow, which means that the popups will be only partly visible.

To avoid this, we can place the popup at the top level of the DOM and position it manually next to the triggering element. Libraries such as [popper.js](https://popper.js.org) and [tippy](https://atomiks.github.io/tippyjs/) make it easy to create and position dropdowns like this.

## Interaction with Click on Close Outside

When these two requirements combine, the click detection starts to cause problems. The popups are all now at the DOM's top level, and not contained within each other, even if they still appear linked visually.

```html
<html>
  <body>
    <div id="app">The main app</div>
    <div class="tippy-container">The List Actions Menu</div>
    <div class="tippy-container">The Delete confirmation popup</div>
  </body>
</html>
```

This means that the document click handler in the first popup will see clicks in the second popup as _outside_. So in the example above, clicking anywhere inside the "Delete this list?" popup causes the "List Actions" popup to close, which in turn closes the "Delete" popup as well. Definitely not the behavior we want.

# Tracking Popups

Fortunately, the solution isn't too difficult. Our existing click handler uses `node.contains` to see if a click event took place inside the current popup. We can expand this by creating a small tracker object to check the event against any children popups as well.

Each popup creates a tracker object, which has a reference to the parent popup tracker and some related methods.

```typescript
  function makePopupTracker(parent) {
    let contained: HTMLElement[] = [];
    return {
      contains(target) {
        // See if any of the registered popups contain the target.
        return contained.some((e) => e.contains(target));
      },
      register(element: HTMLElement) {
        // Add an element to the tracker and also register it recursively
        // on the parent, if any.
        if (parent) {
          parent.register(element);
        }

        contained.push(element);
      },
      unregister(element: HTMLElement) {
        // Remove the element from the tracker and also recursively
        // on the parent, if any.
        if (parent) {
          parent.unregister(element);
        }
        contained = contained.filter((e) => e !== element);
      },
    };
  }
```

The recursive behavior of `register` and `unregister` ensures that every new popup registers with all its parent popups, direct and indirect. Likewise, each popup has complete knowledge of all visible popups that are nested under it.

This method will generalize to any number of nested popups. In almost all cases, there will only ever be one nested popup, but the code is actually simpler to write this way.

We can use a Svelte action to register the popup with the tracker when it appears. This can be added to the existing `clickOnCloseOutside` action or with a new action.

```svelte
<script>
  function registerPopup(node) {
    popupTracker.register(node);
    return {
      destroy() {
        popupTracker.unregister(node);
      }
    };
  }
</script>

<button type="button" on:click={() => (open = !open)}>Open Dropdown</button>
{#if open}
  <div style="position:absolute" use:closeOnClickOutside use:registerPopup>
    Popup Menu
  </div>
{/if}
```

The click handler then just swaps the call to `node.contains` with the popup tracker's equivalent method.

```typescript
if(!popupTracker.contains(event.target)) {
  open = false;
  event.stopImmediatePropagation();
}
```

# Propagating Popup Trackers

Now that we have our popup tracker, we need a way for a nested popup to actually register with its parent. Passing the popup tracker down via properties isn't feasible because there may be any number of components between the current popup and a nested one, and those intermediate components may not even be aware that they are inside a popup.

This is a perfect use for the Svelte [component context](svelte_context) tree. Each popup first reads the context to see if there is a parent popup tracker. It then creates its own popup tracker, which it places into the context for child popups to consume.

```javascript
import { getContext, setContext } from 'svelte';
let parentTracker = getContext('parent-dropdown-tracker');
let popupTracker = makePopupTracker(parentTracker);
setContext('parent-dropdown-tracker', popupTracker);
```

With this context-based propagation in place, each popup can function correctly whether it is nested or not, and whether its content creates other popups or not. No other special handling is needed.
