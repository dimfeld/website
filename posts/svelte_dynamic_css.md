---
title: Dynamic CSS with Svelte
date: 2020-07-05
cardImage:
summary: Using CSS Variables in Svelte
frontPageSummary: CSS Variables in Svelte
draft: true
---

A common request from Svelte newcomers is how to use template expressions in a `<style>` block. This usually comes up in the context of custom themes.

```svelte
<style>
  .note {
    color: {noteColor || '#000000'};
    background-color: {noteBgColor};
  }

  .note::before {
    content: "{notePrefix} || 'A note'";
    margin-right: {notePrefixSpacing};
  }
</style>
```

The problem is that Svelte only compiles template syntax in the HTML section of the component. The `style` section of a component does not use templates, so this method can not be used to generate styles at runtime.

But there is a very good alternative.

# CSS Variables

It turns out that CSS offers built-in support for defining values at runtime. Finalized in 2015, CSS variables let you create style rules that depend on values defined up the element tree from where they are applied.

```html
<style>
  .note {
    color: var(--note-color, --note-other-color, tomato);
    background-color: var(--note-bg-color, lightgray);
  }
</style>
<p class="note">This is important!</p>
```

CSS variables always start with `--`. The `var` function gets the value of a variable, and examines each argument in turn until it finds a variable that has a value, or a constant value.

In this example an element with the class `note` will use the variables `--note-color` and `--note-bg-color` if they are set. The `color` attribute will fall back to `--note-other-color` if it's set, and finally fall back to `tomato`, while the `background-color` will use `lightgray` if `--note-bg-color` is not set.

Of course, variables aren't very useful if we don't set them. Variables can be set either as part of other classes or in the `style` attributes of elements.

<div data-component="Repl" data-prop-id="844a720d073f4ae296843cb6e531b111" data-prop-expanded-width="false">

```html
<style>
	.note {
		color: var(--note-color, tomato);
		background-color: var(--note-bg-color, lightgray);
	}

	.yellow-theme {
		--note-color: black;
		--note-bg-color: khaki;
	}

	.purple-note-text {
		--note-color: rebeccapurple;
   }
</style>

<div style="--note-color:green;--note-bg-color:tomato">
	<h1 class="note" style="font-weight:600">Christmas!</h1>

	<div class="yellow-theme">
     <p class="note">For that yellow notepad look.</p>

     <p class="note purple-note-text">Or with purple</p>
   </div>

</div>
```

</div>

Although variables apply to all children of the element that sets them, any classes or styles that use variables only read those variables at the point where they are set.

The below example is similar to the last, but the `note` class is applied only on the topmost element, and so the CSS variables set in the child elements do not take effect. To use the `note` class with the new values, it needs to be applied again at or below where the variables are reassigned.

<div data-component="Repl" data-prop-id="14c51f9ed5204b56bcdbe4c1fc110e2b" data-prop-expanded-width="false">

```html
<style>
	.note {
		color: var(--note-color, tomato);
		background-color: var(--note-bg-color, lightgray);
	}

	.yellow-theme {
		--note-color: black;
		--note-bg-color: khaki;
	}

	.purple-note-text {
		--note-color: rebeccapurple;
   }
</style>

<!-- Although the note class applies to all the child elements, setting
the CSS variables in child elements does not apply unless we reapply the note class again. -->
<div class="note" style="--note-color:green;--note-bg-color:tomato">
	<h1 style="font-weight:600">Christmas!</h1>

	<div class="yellow-theme">
     <p>For that yellow notepad look.</p>

     <p class="purple-note-text" style="--note-bg-color:white">Or with purple</p>
    </div>

</div>
```

</div>

## Setting CSS Variables through Svelte

As established, we can't use Svelte to modify the rules inside `<style>` tag, but we can generate style attributes in the template itself.

<div data-component="Repl" data-prop-id="8123d474edb04f198c3b83363716a709" data-prop-expanded-width="false">
<p>This [Svelte REPL example](https://svelte.dev/repl/8123d474edb04f198c3b83363716a709?version=3.23.2) sets variables dynamically.</p>
</div>


## Fallbacks for Internet Explorer

It's important to note that CSS variables are not supported in Internet Explorer, so if you need to support it, your stylesheets should provide reasonable fallback defaults.

```css
.classname {
  color: red;
  color: var(--color, red);
}
```

With this pair of rules, Internet Explorer will see the first rule and set the color to red. It will then ignore the second color rule since it's unable to understand the syntax.

Newer browsers will parse both rules, but ignore the first one. Note that the first rule is ignored completely, even if there is no value for the `--color` variable, so the `red` fallback must still be present at the end of the `var` clause rules if you want to provide a default value.

## Global CSS Variables

Sometimes CSS variables need to be globally scoped. The easiest solution to this is to have a top-level `div` in your application that contains all the CSS variables, and use the techniques above to set the variables on that div.

If for some reason this is not possible, you can set your variables directly on the `<body>` element with syntax like this: `$: document.body.style.cssText = styles`.

When you have multiple places that need to write css variables in this way, they should be written using a global manager instead so that all the variable settings will be combined properly.

<div data-component="Repl" data-prop-id="25f0c3653b89434888292a1f92717e2a" data-prop-expanded-width="false">

A simple manager like this can combine style settings from multiple sources. Here's a full example: [Svelte REPL Body Styles](https://svelte.dev/repl/25f0c3653b89434888292a1f92717e2a?version=3.23.2).

```js
const cssVars = new Map();

function refresh() {
  let values = [];
  for(let [key, value] of cssVars) {
    values.push(`--${key}:${value}`);
  }
  document.body.style.cssText = values.join(';');
}

export function set(name, value) {
  cssVars.set(name, value);
  refresh();
}

export function del(name) {
  cssVars.delete(name);
  refresh();
}
```

</div>


The various components in the application can then use this single module to manage the global CSS variables, and so long as the names are unique, everything will work.

# Multiple Classes

If the styles required fall into a finite and reasonably small set of values, an easy way to go about it is to just define a class for each set of styles you want, and switch between them as needed.

```html
<style>
	.green {
		color: white;
		background-color: green;
 	}

	.red: {
		color: black;
		background-color: red;
	}
</style>

<script>
    let isRed = false;
	$: className = isRed ? 'red' : 'green';
</script>

<label><input type="checkbox" bind:value={isRed} /> Red?</label>

<!-- Template syntax in the class attribute -->
<div class={className}>Text</div>

<!-- Or using Svelte's built-in class syntax -->
<div class:red={isRed} class:green={!isRed}>Text</div>
```

# Creating Rules from Scratch

Browsers also support creating rules from scratch with the CSS Object Model (CSSOM), also known as CSS-in-JS. I don't recommend using this approach with Svelte, since you lose the component class scoping behavior of Svelte and most of the packages that use CSSOM spend a lot of effort recreating behaviors that Svelte provides natively.

Most of the CSSOM helper libraries are specifically linked to React or other frameworks, but some, such as [Aphrodite](https://github.com/Khan/aphrodite), can work independently. So it is an option if you really want to go that way.

