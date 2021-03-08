---
title: Coordinating Multiple Elements with Svelte Deferred Transitions, Part 2
date: 2021-03-08
tags: Svelte
cardImage: svelte_deferred_transitions_card.png
cardImageFilter: opacity(80%) brightness(155%) saturation(200%)
---

In the [last post](svelte_deferred_transitions), we looked at how Svelte deferred transitions work and implemented our own version of Svelte’s `crossfade` transition.

This is nice for many cases, but we can use some techniques to create even more complex transitions that involves three or more elements. In this sample application for [svelte-zoomable](https://github.com/dimfeld/svelte-zoomable), there are multiple groups of boxes on the screen at once. When a box is clicked, the other boxes in the group will merge into the clicked box, which then expands to fill the whole area.

<!-- <div data-component="Repl" data-prop-id="32bf500c4b8b4b718daee1fae74b6a51"></div> -->

We start with a `zoomTransition` function that returns a `send` and `receive` pair, just like crossfade.

```javascript
export const [send, receive] = zoomTransition({});
```

Each box has a group id and an element-specific id. [In the code](https://github.com/dimfeld/svelte-zoomable/blob/9347d8f1a55034bef167d073767d822b17aaa999/src/Zoomable.svelte#L82), the zoomed out boxes are called "overviews" and then the zoomed-in box is a "detail" box. Whenever an overview box is clicked, all of the overviews disappear and the detail corresponding to the clicked overview appears on the screen.

```svelte
<script>
  // The full code is at the link above. This is a stripped-down excerpt.
  import { send, receive } from './transition';
  export let elementId;
  export let groupId;
</script>

<!-- This is the detail box, and the overview looks similar -->
<div
    class="zoomed {detailClass}"
    id={elementId.join('-') + '-zoomed'}
    use:style={detailStyle}
    in:receive|local={{
      key: elementId,
      parent: groupId,
      isDetail: true,
    }}
    out:send|local={{
      key: elementId,
      parent: groupId,
      isDetail: true,
    }}
  ><slot name="detail" ></div>
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

Here we have the two maps from the original deferred transition and also the new `siblingData` Map.

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

The transition manager is configurable with [different presets](https://github.com/dimfeld/svelte-zoomable/blob/9347d8f1a55034bef167d073767d822b17aaa999/src/transition.js#L4), which control the timing and type of styles applied during the transition. I'll talk about how this works in the next post in this series.

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

Here we enter the information for this element in the appropriate place: either the detail key or as an entry in the overviews map.

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

Finally we return the function that will run the transition after all the elements have put their information into `siblingData`.

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

The schedule tells this element's transition when to start and end. Again, this will be covered in more detail in the next post, or you can [see it here](https://github.com/dimfeld/svelte-zoomable/blob/master/src/transition_schedulers.js). The default preset tells the "other" overview elements to run in the first half of the transition, and then the selected overview and its detail element to transition in the second half.

```javascript
            let schedule = preset.schedule({
              siblingData: d,
              id: params.key,
              isDetail: params.isDetail,
            });

            start = schedule.start;
            end = schedule.end;

```

If there is a detail object transitioning, but the `rect` in the `counterparts` for this element was missing, then this is
one of the overview elements that was not clicked.

With this in mind, we look up the rectangles for the incoming detail element to get the proper ID, and then look up the clicked overview rectangle as `zoomingOverviewRect`. In the default preset, `preset.otherOverviews` returns a Svelte transition `css` function that fades out this overview box and moves it to overlap with `zoomingOverviewRect`.

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

If we don't have transition styles yet, then this is either the clicked overview element or its corresponding detail element. As with the code above, we gather the information to generate the transition and then call either `preset.detail` or `preset.selectedOverview` to generate the styles.

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

