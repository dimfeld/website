---
title: Supercharge your Browser Console with Custom Functions
summary: Useful code snippets, accessible in an instant.
date: 2020-06-06
cardImage: browser_console_custom_functions_card.png
---

> Many thanks to [Brandon McConnell](https://twitter.com/liquidice13) for posting on Twitter about his experience doing this and inspiring me to try it too.

Running expressions in the JavaScript console is a powerful way to assist in debugging and inspecting web applications. But it can become repetitive.

Every time I use “copy as fetch” in Chrome’s dev tools, I want to add something like `.then((r) => r.json()).then(console.log).catch(console.error);` to the end so I can actually see the result. Often I just settle for "copy as curl" and paste it into the terminal to avoid the hassle of the extra typing. Or maybe you find yourself debugging your own project and commonly typing expressions like `element.querySelectorAll(‘#my-form > input’).filter((x) => x.checked).map((x) => x.id)`.

All this repetitive typing during debugging is, at best, a distraction. Your brain power is best spent thinking about the actual problem, and this adds significant cognitive load and slows down your progress.

# Custom Functions in the Console

These simple, often-used tasks can be automated by putting them into functions. For the examples above, we could write something like this:

```js
function jsonfetch(...args) {
  return fetch(...args).then((r) => r.json());
}

function pfetch(...args) {
  return jsonfetch(...args)
    .then((data) => {
      console.log(data);
      return data;
    })
    .catch(console.error)
}

function showChecked(el) {
  return
    Array.from((el || document)
        .querySelectorAll('input[type=checkbox]'))
    .filter((x) => x.checked)
    .map((x) => x.id);
}

```

Nice and easy. You can build a small library of these functions and paste them into the console any time you want and then use them. But there's an even better way.

# Preloading the Functions

Instead of maintaining a text file full of functions to paste in, they can be always available, ready to use at a moment’s notice, with a bit of one-time effort. There is where browser extensions come in handy.

No, you don’t have to write your own. The TamperMonkey browser extension allows you to automatically run your own JavaScript on any site, so we can write a script that contains all the functions we want to use.

## Setting It Up
First, install the TamperMonkey extension for your browser from https://tampermonkey.net. It’s available for all the major browsers. For Firefox you also have the option of using the [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension.

TamperMonkey will install a button in your toolbar which shows a menu. Select “Create a new script...” from the menu, and you’ll see a new window appear with a template for a script.

There’s some metadata at the top of the file between the `UserScript` tags, and we need to make a few edits so that the script will inject the functions on every website.

```diff
  // ==UserScript==
  // ... other metadata

Remove @match and add @include
- // @match http://*/*
+ // @include *

Optional, but can be useful. You can @require any script to load it into your userscript.
+ // @require https://code.jquery.com/jquery-3.5.1.slim.min.js

  // ==/UserScript==
```

You can also add `@exclude` and `@match` lines to limit the sites on which the script runs. TamperMonkey's [documentation](https://www.tampermonkey.net/documentation.php) describes these more fully. We won't use them now, but they can be useful for scripts that interact with specific elements of certain websites.

## Injecting the Functions

The easiest way to make the functions available in the devtools is to just stick them on the `window` object. Here I'll use `globalThis` since it's the modern way to do it, but it's the same as `window` in a standard browser context.

There is a small risk of name collisions between your custom functions and the site’s existing code. So just to be safe, my script checks if a value exists on `globalThis` before writing it, and then also places all the functions under a `Symbol` key, where I can still retrieve any functions that didn't get set.

```js
(function() {
  'use strict';
  function jsonfetch(...args) {}
  function pfetch(...args) {}
  function showChecked(el) {}

  const functions = {
    jsonfetch,
    pfetch,
    showChecked,
  };

  // Place all the functions on the global object, and be careful to
  // not overwrite existing values.
  for(let key in functions) {
    if(functions.hasOwnProperty(key) && !globalThis[key]) {
      globalThis[key] = functions[key];
    }
  }

  // And also put them in a less conspicuous place, in case some website overwrites one of my functions.
  globalThis[Symbol.for('__didev')] = functions;
})();
```

TamperMonkey’s built-in version of JSHint will warn on uses of `globalThis`, but you can ignore that; it still works fine.

If the script is installed properly, you should see a red `1` badge on the TamperMonkey extension icon in the toolbar when you go to any website. Then the functions are just available in the console.

```js
> pfetch(url);

// Or if we need to get our functions from the Symbol key.
> let dd = window[Symbol.for(‘__didev’)];
> dd.pfetch(url);
```

Let’s use our new functions in a simple example. DuckDuckGo's autocomplete uses a network request that returns a JSON array with suggestions. Let’s open the devtools to the network tab, go to `duckduckgo.com`, and type a word into the search box. Select “copy as fetch” on the resulting `?q=...` request on the network tab and paste it into the console.

![fetch with opaque response](fetch-with-opaque-response.png)

Here we can see the `Promise` returned and the `Response` that it resolves to, but the `Response` needs additional handling to actually see the returned data. Luckily, we just installed a custom function to make that easy.

So instead, let's change `fetch` to our `pfetch` function, and while we're at it, also update the queried term to "banana":

![custom pfetch function example](pfetch.png)

Instead of just a Promise that resolves to a Response object, we see the actual response printed with no extra effort. This is a pretty simple example, but you can automate almost anything on a website with this technique, so if you do anything cool I'd love to hear about it.

And once again, big thanks to [Brandon McConnell (@liquidice13) on Twitter](https://twitter.com/liquidice13) for the idea!
