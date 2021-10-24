---
title: How Svelte Makes Two-Way Binding Safe
date: 2021-10-23
tags: Svelte
---

When React was released, it famously omitted two-way binding between components. This style of binding automatically detects
when an attribute on an element or component changes, and reflects that change into a local variable in your component where
you can use it.

This seems convenient at first, but traditional implementations are error-prone, as it becomes difficult to keep the
bound value and any derived data in sync.

The Svelte framework reintroduces first-class support for two-way binding, to the confusion of those who have
long heard -- and rightfully so -- that it is a bad idea. But Svelte has certain other features that make it not only more convenient to
use, but safe as well.

# One-Way Binding

First, let's take a look at one-way binding, since it is how React and "plain" JavaScript work. With this paradigm, attributes are set on elements and components
in the normal HTML way, and changes in those attributes are handled by added event handlers to the components.

In Svelte, one-way binding might look like this:

<div data-component="Repl" data-prop-id="ab9cdbdd9a6a420288938d51fd17e22a" data-prop-height="500px">

```svelte
<script>
  let value = 'Hello world!';
  let numWords = 2;

  function handleUpdate(e) {
    value = e.target.value;
    numWords = value.split(' ').filter(Boolean).length;
  }
</script>

<input type="text" {value} on:input={handleUpdate} />
<p>
  {numWords} words
</p>
```

</div>

Every time you type in the text field, an event is fired and `handleUpdate` recalculates the `numWords` variable. A bit boilerplate-y,
but pretty easy. As more complex code is added with more components, handlers, and derived state, it can get a bit unwieldy, but most people
consider this inconvenience worth it compared to the problems of two-way binding.

# Two-Way Binding

Two-way binding works similarly behind the scenes. The syntax is more terse, and the framework automatically adds the event handler.

<div data-component="Repl" data-prop-id="0507d12784304b978239a71063f38cde" data-prop-height="400px">

```svelte
<script>
  let value = 'Hello world!';

  $: numWords = value.split(' ').filter(Boolean).length;
</script>

<input type="text" bind:value />
<p>
  {numWords} words
</p>
```

</div>

With traditional two-way binding, you don't really have a way to know when `value` has been updated, and so it becomes
difficult to make sure that any state derived from it is actually up to date. Angular has a "digest" and "watchers" that
rerun all template expressions in a component when something might have changed, and yes it does become a performance problem.

But for anything outside a template, you may be out of luck, and these bugs may manifest in weird ways where sometimes your derived
state ends up with the right value and other times it does not, depending on what else is going on and if one of your code paths that happens
to update the state gets run.

In Angular you can sometimes use `$scope.watch` to handle this, but you have to explicitly remember to use it
where appropriate, and it can be easy to miss if your state happens to update due to other events half the time.

# How Svelte Makes it Safe

So with all these issues, why is it safe in Svelte? You'll notice in the example above, `numWords` is in an expression starting with `$:`. This prefix tells the Svelte compiler
to track the dependencies of that expression (here, just `value`), and automatically rerun the expression any time one of its dependencies changes.

So any time `value` is updated, whether from a `bind:` directive or from other code in the component, the Svelte compiler's generated code automatically
recalculates `numWords`. Even better, if `numWords` starts to depend on other variables, Svelte picks up on that. You don't have to keep track of which
variables your expression relies on since the compiler does it for you.

Having experienced two-way-binding hell in Angular, I was also initially wary of it in Svelte. But having using it for over a year now I've found Svelte's promises
here to be true. There are still situations where you may want to use one-way binding, but they are intentional design choices in your code
rather than a way to avoid consistency bugs.

The only caveat here is that you do have to remember to use the `$:` operator. This is true, but it's not as big of a deal as it might seem to Svelte outsiders.
The operator is such a core part of the framework that it becomes second
nature after short while, and I find myself doing it by default, only putting thought into if I might _not_ want to use it for a particular expression.

The exact mechanisms in the Svelte compiler to track dependencies and rerun expressions aren't particularly complex, but they are out of the scope of a quick blog post. Svelte contributor Tan Li Hau has
covered the topic in great detail, so I recommend his [excellent series on Svelte internals](https://lihautan.com/compile-svelte-in-your-head-part-1/#invalidate)
if you are interested.
