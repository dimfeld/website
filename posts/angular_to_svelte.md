---
title: Converting an Angular Webapp to Svelte
date: 2020-04-30
summary: My experience converting a 6-year-old SPA to Angular
frontPageSummary: my experience converting a 6-year-old SPA to Angular
status: Pretty confident in this. Not necessarily the ideal solution.
---

[My company](https://www.carevoyance.com) in the process of converting our large  web application based on AngularJS 1.x and Angular Material to use Svelte and Tailwind CSS. Here are my experiences so far.

## Converting Templates

Converting Angular components into Svelte is largely a mechanical process. For the most part, each Angular template feature has a direct corollary in Svelte. Some things are simpler and some are more complex but overall it's pretty easy to do. We don't use "attribute directives" much which makes things easier.

The main gotcha there is that AngularJS templates silently drop any exceptions that happen. This is convenient for writing the templates but bad for finding and tracling down bugs.

Directives like `ng-if="info.report.revenue"` sort of work in Angular if `info.report` is undefined, in that the `ng-if` becomes false. But the Svelte equivalent `{#if info.report.revenue}` throws an error. For now we're using lodash `get` in places where we need to and looking forward to Svelte support for optional chaining.

## Component Features and Lifecycle

Svelte slots are much easier to use and reason about than Angular transclude, especially in cases where you don't want an extra wrapper element around the slot content.

It's much easier to reason about what's going on when writing a Svelte component. No need to deal with $onChanges happening before $onInit, or even special handling of changes since it's all taken care of with Svelte's `$:` syntax.

Likewise, `$postLink` simply turns into either `use:` directives or `bind:this={element}` on the relevant DOM node.

## Sharing Code Between Svelte and AngularJS

Angular 1.x uses dependency injection to distributing services around.

```js
// Define a service
export default ng.module('configsModule').factory('UserService', function() {
  return {
    doThis: () => ...,
    doThat: () => ...,
  };
}).name;

// And elsewhere, use it

import configsModule from './configs';
ng.module('anotherModule', [configsModule]).run(function(ConfigsService) {
  // A bundler plugin uses this magic string to set up the
  // data for Angular to inject the services listed in
  // the function arguments.
  'ngInject';

  ConfigsService.doThis();
});
```

As you can guess, this doesn't work for Svelte components since they can't interact with Angular's dependency injection. We are converting our own services to be directly importable as ES6 modules:

```js
export function doThis { ... };
export function doThat { ... };

// And elsewhere...
import { doThis } from './configs';
```

This works for our own services where we have control over how they are exposed. But for third-party Angular packages, we can't easily do this. Svelte components sometimes need access to things like `ui-router` to create links to other places in the app, or `$mdDialog` to show dialogs using the existing system.

Eventually all of these third-party services will be replaced with more modern ones that aren't dependent on Angular, but for now we created a hack solution by defining a `services` object in a file. The Angular module-level `run` function fills that object in with the various services, and then Svelte components can `import` that object and access the services they need. It's a horrible hack, but it works fine. Over time, we are converting our Angular services into normal modules that can be imported from anywhere.

```js
import { services as svelteServices } from './svelte-services';
ng.module('mainModule', [...allTheDependendModules]).run(function($mdDialog, $state) {
  Object.assign(services, {
    mdDialog: $mdDialog,
    state: $state,
  });
});

```

## Direct Interaction Between Svelte and Angular

A lot of Angular asynchronous code returns objects where the promise lives under the `$promise` field, so we added a function to wrap regular promises where legacy Angular code interacts with promises returned from Svelte code.

```js
function wrapRegularPromise(p) {
  if(p && p.$promise) {
    return p.$promise;
  }

  return p;
}

```

It's really helpful that Svelte stores are easy to use in plain JS. We can change a state store over completely to Svelte and make the Angular components subscribe to that store as well without needing to maintain and sync 2 copies of the state.

Embedding Svelte inside Angular is pretty easy, for the most part. I wrote a function that would take in a Svelte component and generate an Angular controller class. Just have to repeat the bindings and event declarations. It's too long to post here but I created a [Github Gist](https://gist.github.com/dimfeld/880decfe300f88119bb4f1141a66e527) with the contents. The class does a few things:

1. Use `$onChanges` to pass on property changes to the Svelte component.
2. In `$postLink`, instantiate the Svelte component.
3. Listen on the Svelte component's events and call the associated Angular `&` function binding.
4. Destroy the Svelte component in `$onDestroy`.

Then to use it, you just create an Angular component like so:

```js
import svelteShim from './svelte-shim.ts';
import MyComponent from './MyComponent.svelte';
export default ng.module('modulename').component('myComponent', {
  controller: svelteShim(MyComponent,
  {
    events: {
      change: 'onChange',
    }
  }),
  bindings: {
    class: '@',
    data: '<',
    onChange: '&',
  }
})
```

We haven't tried (and won't try) embedding Angular code inside Svelte, which means that any Angular component we port to Svelte also requires us to port all the components it uses, directly or indirectly, to Svelte as well. This means that sometimes we have to tackle porting certain components or services earlier than we otherwise would, but in the end it doesn't make a huge difference.

We haven't yet tackled the page routing system. That'll probably be the trickiest part.

## Using Tailwind and Angular Material at the same time

This is a pretty smooth transition despite both frameworks defining a lot of classes.

The biggest problem is when using the Angular Material `flex` directive. This adds a class called `flex` to the component, which acts very much like Tailwind's `flex-1` class. But Tailwind also has a `flex` class which sets `display:flex`. Elements whose children are not supposed to be laid out via flexbox end up looking strange.

This can be worked around by simply using the `flex-1` class instead of the `flex` directive. Angular Material's `flex=NUMBER` directive is still ok to use in markup not yet converted to Tailwind, since it applies a class name that does not overlap with Tailwind.

This does mean that anything with the class `flex` will also essentially have `flex-1` applied, but that can be overridden as needed with additional classes to specify whatever behavior you actually want.
