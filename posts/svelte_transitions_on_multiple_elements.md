---
title: Coordinating Multiple Elements with Svelte Deferred Transitions, Part 2
date: 2021-03-08
tags: Svelte
cardImage: svelte_deferred_transitions_card.png
cardImageFilter: opacity(80%) brightness(155%) saturation(200%)
---

In the [last post](svelte_deferred_transitions), we looked at how Svelte deferred transitions work and implemented our own version of Svelte’s `crossfade` transition.

This is nice for many cases, but we can use some techniques to create even more complex transitions that involves three or more elements. In this sample application for [svelte-zoomable](https://github.com/dimfeld/svelte-zoomable), there are multiple groups of boxes on the screen at once. When a box is clicked, the other boxes in the group will merge into the clicked box, which then expands to fill the whole area.

<div data-component="Repl" data-prop-id="32bf500c4b8b4b718daee1fae74b6a51"></div> 

We start with a `zoomTransition` function that returns a `send` and `receive` pair, just like crossfade.

```javascript
export const [send, receive] = zoomTransition({});
```

Each box has a unique ID and also a group ID that it shares with all its siblings. [In the code](https://github.com/dimfeld/svelte-zoomable/blob/9347d8f1a55034bef167d073767d822b17aaa999/src/Zoomable.svelte#L82), the zoomed out boxes are called *overviews* and each overview has a corresponding *detail* which is the "zoomed in" view for the overview.  Clicking an overview box causes the corresponding detail box to replace it, while all of the other overviews are removed.

```svelte
<script>
  // The full code is at the link above. This is a stripped-down excerpt.
  import { send, receive } from './transition';
  export let elementId;
  export let groupId;
  export let zoomed = false;
</script>

{#if zoomed}
<div
    class="zoomed"
    id={elementId + '-zoomed'}
    in:receive|local={{
      key: elementId,
      parent: groupId,
      isDetail: true,
    }}
    out:send|local={{
      key: elementId,
      parent: groupId,
      isDetail: true,
    }}>
  <slot name="detail" />
</div>
{:else}
<div
    class="overview"
    id={elementId + '-zoomed'}
    in:receive|local={{
      key: elementId,
      parent: groupId,
      isDetail: false,
    }}
    out:send|local={{
      key: elementId,
      parent: groupId,
      isDetail: false,
    }}>
  <slot name="overview" />
</div>

{/if}
```

As before, we track the sending and receiving elements, and we also have a map for tracking all the transitioning elements together. This Map, called `siblingData`, is keyed by the group id of the transitioning elements. It tracks the transitioning elements and facilitate communication between elements in the same group.


# Different transitions for each element

In this case, there are three different animations to play:

1. The incoming detail element transitions in and appears to zoom in from the element it's replacing.
2. The clicked overview element does a crossfade with the incoming detail that is replacing it.
3. The other overview elements move into the clicked overview.

When zooming out (that is, contracting a detail element back to its overview), these animations just run in reverse.

Much of this implementation is very specific to the particular animation that is being run, but the coordination techniques generalize well, and hopefully this can give you some ideas for your own implementation.

The main challenge is that when each element initializes its animation, it has no knowledge of which other elements may be transitioning in or out. So the data structure needs to hold all of the information that could possibly be required, even if some of it might not be used.

In this case, all the transitioning elements need to know the bounding rectangle of the box element which is being replaced, so they can know where to zoom toward. But since we don't know which one will be transitioning right away, we solve the problem by storing **every** overview element's bounding rectangle.

There's always exactly one detail element in this animation, so that makes things easier. When the detail element initializes its animation, it ts own id to the `detail` field in the Map entry. This way, when an overview element starts to transition, it just needs to check if its id matches the detail element's id. If it has the same id, then it knows that it's the element being replaced. Otherwise, it's one of the "other" overview elements.

# Not leaking memory

It's easy to know when an element should put its data into `siblingData`, but we also have to know when its ok to remove the item so that it doesn't sit around forever. With just two elements, it was easy for each element to delete the data for its corresponding element, since nothing else would ever need to consume that data.

But with three or more transitioning elements, we need to take more care to retain the data until everything that may need it has done so.

There's no centralized "transition manager" here that knows when all the transitions have finished, and so the easiest way is to use a decentralized memory management method.

A reference count works well for this purpose. They don't appear often in garbage-collected languages like JavaScript, but they're relatively simple to use. Each entry in the Map has a reference count which starts at 0. When an element adds its data to the Map, it increments the reference count, and it decrements the count when the transition runs and it reads the finished data. When the reference count hits zero, whichever element did the decrement also deletes it from the map.

The main issue that comes up with manual reference counting like this is that we need to always remember to increment or decrement the reference count at the appropriate time. Otherwise the data will be removed too early or it will sit around forever as leaked memory.

To reduce the chance of bugs, we ensure that every element uses the same code paths to put data into the Map and consume it, regardless of its actual role in the resulting transition.

Now, let's look at the actual transition code.

:::side-by-side

```javascript
export function zoomTransition({
  delay: delayParam,
  duration: durationParam,
  easing,
} = {}) {
```

Here we have the `sending` and `receiving` Maps from the original deferred transition and also the new `siblingData` Map.

```javascript
  let sending = new Map();
  let receiving = new Map();

  let siblingData = new Map();

  const send = transition(sending, receiving);
  const receive = transition(receiving, sending);

  function transition(items, counterparts) {
    let isIncoming = items === receiving;

    return (node, params) => {
```

The transition manager is configurable with [different presets](https://github.com/dimfeld/svelte-zoomable/blob/9347d8f1a55034bef167d073767d822b17aaa999/src/transition.js#L4), which control the timing and CSS applied during the transition. I'll talk about how this works in the next post in this series.

```javascript
      let preset = params.preset ?? presets.fade;
```

Again, we start by grabbing the bounding rectangle of this element so that the counterpart element (if it exists) transitioning the opposite way can access it.

```javascript
      let rect = node.getBoundingClientRect();
      items.set(params.key, rect);
```

Get the correct entry from `siblingData`, or create it if it doesn't exist yet. The Map entry has three values:

- The reference count.
- Another Map containing all the overview elements.
- Information about the transitioning detail element.

```javascript
      if (params.parent !== undefined) {
        let d = siblingData.get(params.parent);
        if (!d) {
          d = {
            refCount: 0,
            overviews: new Map(),
            detail: null,
          };

          siblingData.set(params.parent, d);
        }

        // Since we don't know yet which node was actually clicked and which
        // are just the other overviews transitioning out, track them all.
        d.refCount++;
```

Each entry in `siblingData` is shared by all the elements with the same parent, so we enter the information for this element in the appropriate place: either the detail key or as an entry in the overviews map.

```javascript
        if (params.isDetail) {
          d.detail = {
            id: params.key,
            rect,
            incoming: isIncoming,
          };
        } else {
          d.overviews.set(params.key, rect);
        }
      }

```

Finally we return the transition function. By the rules of Svelte deferred transitions, this function will run after all the other transitioning elements have initialized and put their information into `siblingData`.

```javascript
      return () => {
        let rect = counterparts.get(params.key);
        counterparts.delete(params.key);

        if (!rect) {
          // No other element to fade with.
          items.delete(params.key);
        }

        let style;

        let duration = durationParam ?? preset.defaultDuration;
        let delay = delayParam ?? 0;
        let start = 0;
        let end = 1;
        if (params.parent !== undefined) {
          let d = siblingData.get(params.parent);
          if (d) {
```

The schedule tells this element's transition when to start and end in relation to the other transitioning elements. Again, this will be covered in more detail in the next post, or you can [see it here](https://github.com/dimfeld/svelte-zoomable/blob/master/src/transition_schedulers.js). The default preset tells the unselected overview boxes to transition in the first half, and then the selected overview and its detail element will transition in the second half.

```javascript
            let schedule = preset.schedule({
              siblingData: d,
              id: params.key,
              isDetail: params.isDetail,
            });

            start = schedule.start;
            end = schedule.end;

```

If there is a transitioning detail object, but there is no item in `counterparts` for this element, then this is
one of the overview elements that was not clicked.

With this in mind, we look up the rectangles for the incoming detail element to get the proper ID, and then look up the clicked overview rectangle as `zoomingOverviewRect`. 

In the default preset, `otherOverviews` returns a Svelte transition `css` function that fades out this overview box and moves it to overlap with `zoomingOverviewRect`.

If for some reason we don't have a `zoomingOverviewRect`, we degrade gracefully by having the element just disappear with a transition that does nothing.

```javascript
            if (d.detail && !rect) {
              let detailRect = d.detail.rect;
              let zoomingOverviewRect = d.overviews.get(d.detail.id);

              let executorParams = {
                detailRect,
                activeOverviewRect: zoomingOverviewRect,
                otherRect: null,
                node,
                start,
                end,
              };

              style = zoomingOverviewRect
                ? preset.otherOverviews(executorParams)
                : transitions.none();
            }
```

Finally, the memory management. We decrement the reference count, and delete the item if everything else is done with it.

```javascript

            d.refCount--;
            if (!d.refCount) {
              siblingData.delete(params.parent);
            }
          }
        }

```

The code above sets the transition style for the unselected overview boxes, so if we don't have one yet, then this is either the clicked overview element or its corresponding detail element. As with the code above, we gather the information to generate the transition and then call either `preset.detail` or `preset.selectedOverview` to generate the styles.

```javascript
        if (!style) {
          if (rect) {
            let nodeRect = node.getBoundingClientRect();
            let executorParams = {
              detailRect: params.isDetail ? nodeRect : rect,
              activeOverviewRect: params.isDetail ? rect : nodeRect,
              otherRect: rect,
              node,
              start,
              end,
            };
            // This is one of the "active" elements
            style = params.isDetail
              ? preset.detail(executorParams)
              : preset.selectedOverview(executorParams);
          } else {
            // There is no other element, so just do nothing.
            style = transitions.none();
          }
        }

```

And with that done, we simply return the transition data to the Svelte runtime.

```javascript
        return {
          delay,
          duration,
          easing,
          ...style,
        };
      };
    };
  }

  return [send, receive];
}

export const [send, receive] = zoomTransition({});
```

:::

The beauty of Svelte transitions here is that nothing in any of this code cares about the direction the transition is running. We can write everything assuming that the transition is running forward and that the user clicked an overview to zoom in. When the user zooms out or goes up a level, Svelte reverses the transition for us and it all just works, even in a complex example like this.

And that's it. A bit complicated, but not too bad to understand I hope. Please reach out and let me know if anything remains unclear!
