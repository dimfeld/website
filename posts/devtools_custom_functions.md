---
title: Supercharge your dev tools with custom functions
draft: true
date: 2020-05-30
cardImage:
---

> Many thanks to [Brandon McConnell](https://twitter.com/liquidice13) for posting on Twitter about his experience doing this and inspiring me to try it too.

Running expressions in the JavaScript console is a powerful way to assist in debugging and inspecting web applications. But it can become repetitive. We type the same complicated expressions over and over.

How many times have you used “copy as fetch” in Chrome’s dev tools, and added `.then((r) => r.json()).then(console.log).catch(console.error);` to the end so you can actually see the result?  How many times have you just settled for "copy as curl" to avoid the hassle of the extra typing? Or maybe you find yourself often typing expressions like `element.querySelectorAll(‘input’).filter((x) => x.checked).map((x) => x.id)`.

All this repetitive typing is, at best, a distraction. It adds significant  cognitive load to the debugging process when that brain power would be better spent thinking about the actual problem.

# Custom Functions in the Console

One way to make this easier is to define a small library of helper functions that can automate a lot of these simple, often-used tasks. For the examples above, we could write something like this.

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
	return element
		.querySelectorAll(‘input’)
		.filter((x) => x.checked)
      .map((x) => x.id);
}
```

Nice and easy. You can build a small library of these functions and paste them into the console any time you want and then use them. But there's an even better way.

# Preloading the Functions

Instead of maintaining a text file full of functions to paste in, with a bit more up-front effort they can be always available, ready to use at a moment’s notice. There is where browser extensions come in handy.

No, you don’t have to write your own. (Though that is an option! Kent C. Dodds wrote an [article about doing this](https://kentcdodds.com/blog/make-your-own-dev-tools).) The TamperMonkey browser extension allows you to automatically run your own JavaScript on any site, so we can write a script that contains all the functions we want to use.

## Setting It Up
First, install the TamperMonkey extension for your browser from https://tampermonkey.net. It’s available for all the major browsers. For Firefox you also have the option of using the [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) extension.

TamperMonkey will install a button in your toolbar which shows a menu. Select “Create a new script...” from the menu, and you’ll see a new window appear with a template for a script.

There’s some metadata at the top of the file, and we need to add a few lines between the `UserScript` tags so that the script will inject the functions everywhere.

```
@include *
@run-at document-start
```

These lines tell the script to run on every website, and to load right at the beginning when the document starts loading. You can also add `@exclude` and `@match` lines to limit the sites on which the script runs. TamperMonkey's [documentation](https://www.tampermonkey.net/documentation.php) describes these more fully.

Finally, you should probably go to the settings tab and set “Run only in top frame” to Yes. This prevents the script from running in the `iframe` elements that are usually just ads or social sharing buttons.

## Injecting the Functions

The easiest way to make the functions available in the devtools is to just stick them on the `globalThis` object, which is `window` in a standard browser context. If you’re on a site that places its own data in `window`, that runs a risk of name collisions between your custom functions and the site’s existing code. You might not care, but I like to put all my functions inside a single object and then place that on `globalThis[Symbol.for(‘unique but easy name to remember’)]`. This eliminates the risk of interference while still making them easily retrievable.

```js
(function() {
  'use strict';
  function jsonfetch(...args) {}
  function pfetch(...args) {}
  function showChecked(el) {}

  globalThis[Symbol.for('__didev')] = {
    jsonfetch,
    pfetch,
    showChecked,
  };
})();
```

TamperMonkey’s built-in version of JSHint doesn’t know about `globalThis`, so it will warn on the line that uses it, but you can ignore that.

Once the script is saved, then we can access the functions from any site.

```js
let dd = window[Symbol.for(‘__didev’)];
```

Using `let` here prevents the variable from being placed on the global scope while still making it available in the console. The console should autocomplete all this next time you type it, so it becomes quick to access.

Let’s use our new functions. I'll use DuckDuckGo as an example. It fetches a `country.json` , so let’s open the devtools to the network tab, and go to `duckduckgo.com`. Select “copy as fetch”, on the network tab and paste it into the console. Finally, change `fetch` to our `dd.pfetch` function:

![custom pfetch function example](pfetch.png)

Instead of just a Promise that resolves to a Response object, we see the actual response `{ country: “US” }` printed with no extra hassle.

Once again, big thanks to [Brandon McConnell (@liquidice13) on Twitter](https://twitter.com/liquidice13) for showing me how he did this in his own environment. This is a pretty simple example, but you can automate almost anything with this technique, so if you do anything cool I'd love to hear about it!
