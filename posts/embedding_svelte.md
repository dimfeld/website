---
title: Embedding Svelte Components
date: 2020-05-27
summary: Using the Svelte JS API to embed components
frontPageSummary: using the Svelte JS API to embed components
cardImage: and-thats-it.gif
cardType: summary_large_image
---

One thing I've wanted for my site is the ability to embed interactive components in my writing. Inspired by [pngwn](https://twitter.com/evilpingwin)'s excellent work on the [mdsvex](https://mdsvex.pngwn.io/) Svelte plugin, and in preparation for my upcoming post on visualizations, I decided to finally take the plunge and get component embedding to work here too.

<div data-component="ReadingSince"></div>

Mdsvex works as a Svelte preprocessor. A preprocessor's job is to take some part of a Svelte component as input and return something parsable by the Svelte compiler. In this case, Mdsvex parses a combination of markdown and Svelte templates, and converts it into a valid Svelte template for the compiler to parse.

For this site, I have the post content separated from the code, and my static generator does various indexing tasks on the post content and frontmatter. Putting all the posts through the build pipeline would make that more difficult, and so I was left with two options:

* Call mdsvex at runtime with the appropriate input.
* Roll my own. <span data-component="Roller"></span>

In the interest of time, I decided to just write my own support. It's not nearly as clean of an experience as a proper mdsvex integration would be, but it works pretty well. Let's see how it works.

# The Svelte Component API

One nice thing about Svelte is that it exposes [an easy-to-use API](https://svelte.dev/docs#Client-side_component_API) for embedding components in non-Svelte environments. I've used this extensively at work as we do a [piecemeal upgrade of our website to Svelte](angular_to_svelte).

Just as in Svelte, each component can be imported as an ES Module

```js
import Component from './CompiledComponent.js';
const container = document.querySelector('#container');

const c = new Component({
  target: container,
  // A child of 'target' to render the component immediately before.
  anchor: null,
  props: {
    a: 5,
    b: 'Another value',
    c: 10,
  }
});

```

And that's it. Of course, in a real web application, you will probably want to interact with the component after you create it.

```js
// Handle events!
c.$on('event', handleEvent);

// Update properties!
c.$set({ a: 6, b: 'Changed' });

// And when we're done, tear it down!
c.$destroy();
```

For components compiled with [accessors](https://svelte.dev/docs#svelte_options), you can also access and modify properties directly.

```js
c.a = c.a + 1;
```

# Embedding in this Site

For this site, I came up with a pretty simple solution. The file [dynamicComponents.ts](https://github.com/dimfeld/website/blob/master/src/dynamicComponents.ts) maintains a catalog of all the embeddable components and exposes a function `instantiateComponents` that searches the rendered HTML for special `div` elements with information on what should go in each one.

First, it looks for `div` elements that contain a `data-component` attribute.

```js
let components: SvelteComponent[] = [];
let divs = document.querySelectorAll('[data-component]');
for (let div of divs) {
  let instance = instantiateComponent(div);
  if (instance) {
      components.push(instance);
  }
}
```

The special div element is pretty simple. This is embedded directly in the markdown.

```html
<div data-component="ReadingSince" data-prop-a="5"></div>
```

Once it finds the elements, it passes each one to the `instantiateComponent` function, which matches up the component name to one in the catalog, pulls out the property attributes, and creates the component into the document.

```js
let attrs = element.getAttributeNames();

let component: typeof SvelteComponent | null = null;
let props: { [key: string]: string } = {};
for (let attr of attrs) {
  let value = element.getAttribute(attr);
  if (!value) {
    continue;
  }

  if (attr === 'data-component') {
    component = catalog[value];
  } else if (attr.startsWith('data-prop-')) {
    let propName = attr.slice('data-prop-'.length);
    props[propName] = value;
  }
}

if(!component) { return; }

return new component({
  target: element,
  props,
});
```

Finally, we return a function that tears down all the components.

```js
return () => {
  for (let component of components) {
    component.$destroy();
  }
};
```

And in the [`Article`](https://github.com/dimfeld/website/blob/master/src/routes/writing/_Article.svelte) component that renders each post, it's a simple matter of calling the function. Svelte's `onMount` allows you to return a function that will be called when the component unmounts, so we take advantage of that here and just let `instantiateComponents` return its destroy function directly into `onMount`.

```js
onMount(instantiateComponents);
```

<div data-component="Slider" data-prop-text="And that's it!"></div>

<div data-component="ReadingSince" data-prop-prefix="You spent " data-prop-suffix=" reading this page. Thanks!"></div>
