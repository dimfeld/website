---
title: Managing Nested Popups
date: 2020-10-01
# cardImage: svelte-single-element-each-2.png
# cardImageFilter: opacity(80%) brightness(155%)
---

Just as a select menu's dropdown closes when you click elsewhere, we usually want custom dropdowns to also support this behavior, commonly referred to as "close on click outside." Enabling this behavior is usually a fairly straightforward process, but when a few requirements are combined, it can become tricky.

# Implementing Close On Click Outside

The basic implementation is pretty simple. When the popup is open, we listen for clicks on the entire document and close the dropdown if the click is not inside the popup.

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
  <div style="position:absolute" use:closeOnClickOutside>
    Popup Menu
  </div>
{/if}
```

# Common Requirements for Dropdowns

## Nested Dropdowns

Putting one dropdown inside another is usually a bad idea, but in some cases it can actually simplify the flow compared to modal dialogs.

![](https://firebasestorage.googleapis.com/v0/b/firescript-577a2.appspot.com/o/imgs%2Fapp%2Fdanielimfeld%2F7blB-T6UtY.png?alt=media&token=01b87771-66d6-47b1-954f-45af2195480a)

In this example, clicking the List Actions button brings up a menu popup, and clicking "Delete this List" brings up another popup to confirm the deletion. Because the "Delete" popup is contained in the DOM tree of the "List Actions" popup, the click detection works properly.

## Hoisting Dropdowns in the DOM

When possible, it's convenient to just attach the popup menu to the element that creates it, like in the example above.  But many applications trigger popups from elements with clipped overflow, which means that the popups will be cut off.

To avoid this, we can place the popup at the top level of the DOM and position it manually next to the triggering element. Libraries such as [popper.js](https://popper.js.org) and [tippy](https://atomiks.github.io/tippyjs/) make it easy to create and position dropdowns like this.

## Interaction with Click on Close Outside

When these two requirements combine, the click detection starts to cause problems. The popups are all now at the DOM's top level, and not contained within each other, even if they still appear linked visually.

This means that `node.contains` in the click handler returns `false` when a click event comes from a nested popup. So clicking anywhere inside the "Delete" popup causes the "List Action" popup to close, which in turn closes the "Delete" popup as well.

# Tracking Popups

Fortunately, the solution isn't too difficult. Our existing click handler uses `node.contains` to see if a click even took place inside the current popup. We can expand this by creating a small tracker object to check the event against any children popups as well.

Each popup creates its own tracker object, which has a reference to the parent popup tracker and some related methods.

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

The recursive behavior of `register` and `unregister` ensures that every popup has complete knowledge of all visible popups that are nested under it. In almost all cases, there will only be one nested popup, but this method generalizes to any number.

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


{#if open}
  <div style="position:absolute" use:closeOnClickOutside use:registerPopup>
    Popup Menu
  </div>
{/if}
```

The click handler then just uses the popup tracker's contain method.

```javascript
if(popupTracker.contains(node)) {
  open = false;
  event.stopImmediatePropagation();
}
```

# Propagating Popup Trackers

Now that we have our popup tracker, we need a way for the child popups to actually register with their parents. Passing the popup tracker down via properties isn't feasible because there may be any number of components between the current popup and a nested one, and those intermediate components may not even be aware that they are inside a popup.

This is a perfect use for the Svelte component context tree. Each popup first looks to see if there is a parent popup tracker in the context. It then creates its own popup tracker, and places this new popup tracker in the context for any other nested popups to use.

```javascript
let parentTracker = getContext('parent-dropdown-tracker');
let popupTracker = makePopupTracker(parentTracker);
setContext('parent-dropdown-tracker', popupTracker);
```

With this context-based propagation in place, each popup can function correctly whether it is nested or not, and whether its content creates other popups or not. No other special handling is needed.

# An example
