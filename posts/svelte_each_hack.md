---
title: "Suppressing Svelte transitions with the #each hack"
date: 2020-06-30
cardImage: svelte-single-element-each-2.png
---

A common question I've seen in the [Svelte Discord](https://svelte.dev/chat) is how to force a component to recreate itself when some of its input data changes. I think this is usually an anti-pattern, but the technique to make it work does have some other interesting uses.


# Single-element keyed #each

Svelte's `#each` statement allows you to specify a key for each item in an array. When the array updates, Svelte can then use this key to match items in the old array to the items in the new array, and see what changed.

Using a single-element array and a keyed `#each` statement, we can force Svelte into recreating elements instead of performing a partial update:

```svelte
{#each [key] as k (k)}
  <SomeComponent />
{/each}
```

Now any time the value of `key` changes, `SomeComponent` will be completely torn down and reconstructed. With there are occasional good reasons to do this, I prefer to avoid it as much as possible, and instead just make components react to changes in their properties.

# Suppressing Transitions

That said, I did discover a good use for the single-element `#each` while working on a new referrals analysis view for [Carevoyance](https://www.carevoyance.com/). One portion of this view allows the user to maintain a list of interesting physicians, and the `animate:flip` and `transition:fade` directives provide nice animations when physicians are added to and removed from the list.

The original code, vastly simplified, looked something like this:

```svelte
{#each list.people as person (person.name) }
  <div animate:flip={{duration: 500}} transition:fade|local={{duration: 500}}>
    {person.name}
  </div>
{/each}
```

After the initial implementation, I updated the code to support creating multiple lists and switching between them. Now, the transitions still ran when switching between lists, and it did not look good.

Most of the rows faded in and out, while physicians who were present in both lists slid around to their new positions. It felt slow and disconcerting, so I wanted to bypass the transitions when switching lists.

This is where the single-element keyed `#each` comes in. We can still get the nice transitions when updating `list.people`, but reassigning `list` to point to an entirely different list recreates the entire block and skips the transitions.

```svelte
{#each [list] as l (l.id)}
  <div>
    {#each list.people as person (person.name) }
      <div animate:flip={{duration: 500}} transition:fade|local={{duration: 500}}>
        {person.name}
      </div>
    {/each}
  </div>
{/each}
```

The `|local` modifier on the fade transition is important here. It tells the fade to run only if the template block it belongs to (here, the `#each list.people` block) is changing, not if one of the parent blocks (the `#each [list]` block) is changing.

Here's a quick example where you can see the different behaviors with and without the single-element `#each` statement.

<div data-component="PostReplSingleElementEach"></div>

And that's it! This isn't something that comes up too often, but it's a nice trick to have when you need it.
