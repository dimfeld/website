---
title: Using and Understanding Context in Svelte
draft: true
date: 2020-05-29
cardImage:
---

I've been chatting in the [Svelte Discord](https://svelte.dev/chat) for the past few weeks, and noticed a common theme among Svelte newcomers of misunderstanding how component context works and what you can do with it.

# What is Context

Component context is one way of sharing data between a component and the child components below it. The context for each component is just a Javascript Map with some set of keys and values.

A component uses the `getContext` function to retrieve the data associated with a key on the context passed from its parent. The `setContext` function sets a value associated with a key on the component's context. Data added via `setContext` is only visible to the component and its children; there is no way to alter the context of a parent component.

```js
// Get `data` from the parent's context
let value = getContext('data');

// If components below this one run `getContext('data')` it will return 10.
setContext('data', 10)
setContext('other-data', 11);
```

# When to use Context

When many people first learn about context, it seems like a panacea and they end up reaching for it in many cases where other approaches are simpler. In reality, context is best used when:

- You want to share some state only with a select subtree of the components
- There may be multiple subtrees in the application that are sharing this state. A good example is, a chart component that uses context to share scaling information with the various subcomponents of the chart.
- There is some state that the root component sets and other components far down the component tree may want to use, and it's not convenient to pass it all the way down via props.

So, if your needs don't fit into the above list, why not use context anyway? Well, it does have downsides:

- Risk of unrelated components trying to use the same context key and overwriting each other's data. There are ways around this though.
- You have to remember to abide by the [restrictions](#accessing-context-at-the-right-time) on when context can be accessed.
- Development tools such as the Svelte compiler and editor plugins are unable to check mistakes in your context usage.
- If you're using Typescript, the alternatives retain type information much better.

At the [end of this article](#alternatives-to-context) I talk about two other methods of sharing state within a component tree that may be preferable.

# Context Inheritance

When a component is created, Svelte sets up some internal state, and this includes the context. Looking inside the Svelte source at `src/runtime/internal/Component.ts`, we see that it initializes the component's context with a copy of the parent's context:

```js
const $$: T$$ = component.$$ = {
    // ... other data intialized here too
    context: new Map(parent_component ? parent_component.$$.context : []),
}
```

The `getContext` and `setContext` functions simply call `get` and `set` on this Map.

# Preventing Key Interference

One risk using context is that if you choose a generic enough name, such as `info`, some other component in the tree may unwittingly overwrite your data by setting the same key.

This can be avoided by choosing a relatively unique string, but there is a better solution. Because the context is a Javascript Map, the keys can be almost anything, including objects.

```js
// context.js
// Export an object
export default {};
// or maybe this instead
export default Symbol('datakey');

// component.Svelte
<script>
    import { setContext } from 'svelte';
    import contextKey from './context';
    setContext(contextKey, someData);
</script>
```

Now the context key is a reference to a particular object It's impossible for anything else to interfere, since other uses of this context data need to intentionally import that object from `context.js` to use the key.

This is slightly less convenient than just using a string, but it adds some nice robustness and also removes the risk of typos in the context key. That said, using a reasonably unique string should be fine in most cases.

<div data-component="PostReplSvelteContext" data-prop-preset="context_key"></div>


# Accessing Context at the Right Time

Context can only be accessed in the top level of the component script while it is initializing. Internally, Svelte sets a global `current_component` variable as a component is initializing, and this is the variable that `getContext` and `setContext` reference to determine which context they should be getting and setting from.

`current_component` is set *only* when the component is being created and running its top-level code for the first time, so this is the only time that you can call the context functions. Calling them at any other time will cause an error.

Concretely, this means that you can't call `getContext` or `setContext` from any of these places:

- A reactive statement (i.e. a `$:` expression)
- A template expression
- An asynchronous callback or promise chain
- A function in another file. (Well, you can if you're careful to only call that function at startup time. Still, generally not a good idea.)
- `onMount`, `onDestroy`, or other lifecycle functions.

As of Svelte 3.23.2 it does currently work to call `getContext` during `onMount` but I don't think this is intended, so don't do it.

Simply put, make sure to get your context data right at the start, even if you don't need it immediately.

<div data-component="PostReplSvelteContext" data-prop-preset="context_after_init"></div>


# Reactive Data in Context

A common question is how to put reactive data in the context. Since context data can only be accessed when the component is initializing, and a child component is unable to alter the context of its parents, this seems impossible at first glance. Fortunately, the solution is simple: instead of setting a value in the context, use a store instead.

```js
// Parent.svelte
let x = writable(0);
setContext('data', x);

// Child.svelte
let x = getContext('data');
$: value = $x + 1;
```

<div data-component="PostReplSvelteContext" data-prop-preset="store_in_context"></div>

# Alternatives to Context

## Props and Event Dispatching

## Global Stores

