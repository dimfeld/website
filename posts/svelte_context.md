---
title: When to Use Component Context in Svelte
date: 2020-06-19
cardImage:
summary: Usage patterns and recommendations for Svelte context
frontPageSummary: usage patterns and recommendations for context data in Svelte
confidence: I've used context a bunch and looked into the internals, and I think I have a good understanding of it. If you disagree about when it's proper to use context I'd love to hear your thoughts.
---

I've been chatting in the [Svelte Discord](https://svelte.dev/chat) for the past few weeks, and it seems like the use of component context is a common misunderstanding among new users. I'm writing this as a reference to fill in the gaps and make some recommendations about when to use it or not.

# Context Inheritance

Each component created in Svelte has some associated data, and this data is automatically passed down to all of its child components. The `getContext` and `setContext` functions can access data associated with a key on the context.

Data added via `setContext` is only visible to the current component and its children; there is no way to alter the context of a parent component. The context is just a Javascript Map with some set of keys and values, so anything that can be stored in a Map can go in the context.

```js
// Get `data` from the parent's context
let value = getContext('data');

// Running `getContext('data')` in child components will return `value + 1`.
// Without this statement, child components would see `value`, as set in the parent.
setContext('data', value + 1)

// We can also add new keys.
setContext('other-data', 11);
```

Svelte sets up some internal state for each component it creates, and this includes the context for the component. Looking inside the Svelte source at [`src/runtime/internal/Component.ts`](https://github.com/sveltejs/svelte/blob/1644f207b107b01e4fa6b377ba81f392709124b6/src/runtime/internal/Component.ts#L119), we see that it initializes the component's context with a copy of the parent's context:

```typescript
const $$: T$$ = component.$$ = {
    // ... other data initialized here too
    context: new Map(parent_component ? parent_component.$$.context : []),
}
```

The `getContext` and `setContext` functions simply call `get` and `set` on this Map.

# When to use Context

Many people who first learn about context see it as a panacea for state distribution, and they end up reaching for it in many cases where other approaches are simpler.

In reality, context is best used when you want to share some state only with a select subtree of components in your application, and there may be multiple subtrees in the application with their own versions of this state.

For example, a top-level chart component may use context to share information specific to that chart with its various subcomponents. Each instance of the chart throughout the application would have its own context. The Svelte [Layer Cake](https://layercake.graphics/) chart package uses this approach.

So, if your needs don't fit into this scenario, why not use context anyway? Well, it does have downsides:

- Risk of unrelated components trying to use the same context key and overwriting each other's data. There are ways around this though.
- You have to remember to abide by the [restrictions](#accessing-context-at-the-right-time) on when context can be accessed.
- Development tools such as the Svelte compiler and editor plugins are unable to check mistakes in your context usage.
- If you're using Typescript, the alternatives retain type information much better.

At the [end of this article](#alternatives-to-context) I talk about two other methods of sharing state within a component tree that may be preferable.

# Reactive Data in Context

A common question is how to put reactive data in the context. Since context data can only be accessed when the component is initializing, and a child component is unable to alter its parent's context, this seems impossible at first glance. Fortunately, the solution is simple: instead of setting a value in the context, use a store instead.

```js
// Parent.svelte
let x = writable(0);
setContext('data', x);

// Child.svelte
let x = getContext('data');
$: value = $x + 1;
```

In the example below, `X` is a store set in the context of the top-level component, and the `Child` component sets its own store `Y` which is shared between it and its `Grandchild` component.

<div data-component="PostReplSvelteContext" data-prop-preset="store_in_context"></div>

# Accessing Context at the Right Time

Context can only be accessed in the top level of the component script while it is initializing. Internally, Svelte sets a global `current_component` variable as a component is initializing, and `getContext` and `setContext` reference it to determine which context they should be getting and setting.

`current_component` is set *only* when the component is being created and running its top-level code for the first time, so this is the only time that you can call the context functions. Calling them at any other time will cause an error.

Concretely, this means that you can't call `getContext` or `setContext` from any of these places:

- A reactive statement (i.e. a `$:` expression)
- A template expression
- An asynchronous callback or promise chain
- A function in another file. (Well, you can if you're careful to only call that function at startup time. Still, generally not a good idea.)
- `onMount`, `onDestroy`, or other lifecycle functions.

As of Svelte 3.23.2 it actually does work to call `getContext` during `onMount` but I don't think this is intended, so don't do it.

Simply put, make sure to get your context data right at the start, even if you don't need it immediately.

<div data-component="PostReplSvelteContext" data-prop-preset="context_after_init"></div>

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

# Alternatives to Context

## Props and Event Dispatching

The simplest way to distribute state throughout the application is to use component properties and event dispatching. Parent components pass data down to their children using the properties, and see changes either through the components dispatching events, use of the `bind:` syntax, or updates to stores.

When a particular piece of state needs to be used widely throughout an application, this can become burdensome. There is where global stores are useful.

## Global Stores

When it's feasible, my favorite method of distributing state across a large number of components is to define a store in another Javascript file, and just import it everywhere that it's needed.

<div data-component="PostReplSvelteContext" data-prop-preset="store_separate_file"></div>
