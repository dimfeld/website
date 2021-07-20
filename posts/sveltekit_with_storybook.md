---
title: Setting up SvelteKit with Storybook
summary: All the workarounds in one place
frontPageSummary: all the workounds needed to get it working properly
date: 2021-07-19
tags: Svelte
---

I've become a big fan of using Storybook to develop components in an isolated context,
and so it was a natural choice to use it for [Ergo](https://github.com/dimfeld/ergo).
In the process I found that some workarounds are needed to get things to work with SvelteKit,
so this sums up everything I learned about getting it to actually work.

If you don't want to read the whole process, feel free to [skip to the end](#summing-it-up), where I sum it up
and provide a sample Github repository with all the fixes.

Once you have [set up a SvelteKit project](https://kit.svelte.dev/docs#introduction-getting-started), the easiest way to add Storybook is with the `npx sb init` command.
This installer will detect the project type and install all the necessary dependencies and configuration files.

# First Run

Ok, let's try it!

```sh
$ npm run storybook

> sveltekit-storybook@0.0.1 storybook sveltekit-storybook
> start-storybook -p 6006

info @storybook/svelte v6.3.4
info
ERR! Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: sveltekit-storybook/.storybook/main.js
ERR! require() of ES modules is not supported.

And more errors...
```

# The .cjs File Extension

This is a common issue when using development tools with projects that set `"type": "module"` in the package.json file, as SvelteKit does. Storybook uses `require` to include `.storybook/main.js`, but that file is an ES Module due to the project settings, so it [can not be loaded via `require`](https://nodejs.org/api/esm.html#esm_require).

Fortunately, there's a solution. Rename the file to `.storybook/main.cjs`, and Node.js will force it to be treated as a traditional "CommonJS"
style module, that can be loaded with `require`. Storybook is set up to look for this extension, so it all works.

Trying again..

```sh
$ mv .storybook/main.js .storybook/main.cjs
$ npm run storybook
~/projects/sveltekit-storybook ❯ npm run storybook

> svelte-storybook@0.0.1 storybook sveltekit-storybook
> start-storybook -p 6006

info @storybook/svelte v6.3.4
info
ERR! Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: sveltekit-storybook/svelte.config.js
ERR! require() of ES modules is not supported.
```

Same issue, but slightly trickier. Storybook tries to be helpful and load the Svelte preprocessor configuration from your `svelte.config.js`
file, but since we converted `.storybook/main.js` to be a CommonJS module, now it can't `require` an ES module like `svelte.config.js`.

# Duplicate svelte-preprocess Configuration

In this case we can't just rename the file since SvelteKit complains loudly if the file is named `svelte.config.cjs`. The easiest solution I've found
here is to just make the Storybook `main.cjs` file recreate the preprocessor configuration instead of pulling it in from `svelte.config.js`. Not
ideal, but it's a pretty small bit of configuration to duplicate, so not that big a deal.

```javascript
const preprocess = require('svelte-preprocess');

module.exports = {
  // The rest of the config here...
  svelteOptions: {
    // Same options that you pass to preprocess in svelte.config.js
    preprocess: preprocess(),
  },
};
```

Ok, let's try again.

```sh
$ pnpm storybook

> svelte-storybook@0.0.1 storybook sveltekit-storybook
> start-storybook -p 6006

info @storybook/svelte v6.3.4
info
info => Loading presets
WARN Unable to find main.js: sveltekit-storybook/.storybook/main
info => Loading 1 config file in "sveltekit-storybook/.storybook"
info => Loading 9 other files in "sveltekit-storybook/.storybook"
info => Adding stories defined in "sveltekit-storybook/.storybook/main.js"
WARN Unable to find main.js: sveltekit-storybook/.storybook/main
info => Using implicit CSS loaders
info => Using default Webpack4 setup

And more output...
```

Despite the "Unable to find main.js" warning, it works!

# Modern JS Syntax Problems

Well, mostly. You can develop just fine for a while this way, but as soon as you use optional chaining or nullish coalescing, it falls apart. (That is, the `.?` or `??` operators.)

You can sort of get away with it by using Typescript to convert these features into older equivalents, but
Svelte's TypeScript support doesn't currently process the template, so a component like this one will still have trouble.

```svelte
<script lang="ts">
  export let value;
  export let defaultValue = 'N/A';
</script>

{value ?? defaultValue}
```

Storybook uses Webpack 4 by default, which doesn't support these newer JavaScript syntax features. A common solution here is to force
Webpack to use a newer version of the `acorn` dependency, which it uses for parsing JavaScript. For Storybook, this causes very strange
issues that mostly prevent Storybook from working at all.

A better solution is to use Webpack 5. Storybook recently gained full support for Webpack 5, so this can be enabled with just a few commands.

```sh
$ npm install --save-dev \
  @storybook/builder-webpack5 @storybook/manager-webpack5
```

Once the dependencies are installed, a small update to our `main.cjs` will enable it.

```javascript
module.exports = {
  core: {
    builder: 'webpack5',
  },
  svelteOptions: {
    preprocess: preprocess(),
  },
  // Rest of the configuration here
};
```

# Updating the Webpack Configuration

This doesn't quite work though. I'll skip all the errors but there are two things in the Webpack 5 configuration that need fixing:

1. All files must reference the same copy of the `svelte` library to avoid the dreaded "function called outside component initialization" error.
2. With `"type": "module"`, the Webpack resolver must be set to `fullySpecified: false`, so that `import` calls don't need to have the full file extension to work properly.

Storybook allows us to add a `webpackFinal` function to our configuration to make these changes.

```javascript
const path = require('path');
const preprocess = require('svelte-preprocess');

module.exports = {
  core: {
    builder: 'webpack5',
  },
  svelteOptions: {
    preprocess: preprocess(),
  },
  webpackFinal: async (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        svelte: path.resolve(__dirname, '..', 'node_modules', 'svelte'),
      },
      mainFields: ['svelte', 'browser', 'module', 'main'],
    };

    config.module.rules.push({
      resolve: {
        fullySpecified: false,
        extensions: ['.js', '.ts'],
      },
    });

    return config;
  },
  // Rest of the config...
};
```

# One Last Error

With all these changes, our Storybook compiles once again! But there's one last error that shows up when loading Storybook
in the browser. The devtools reveal the problem:

```
Uncaught ReferenceError: require is not defined
    at Object../.storybook/generated-stories-entry.js (generated-stories-entry.js:3)
    at __webpack_require__ (bootstrap:24)
    at __webpack_exec__ (main.iframe.bundle.js:221)
    at main.iframe.bundle.js:222
    at Function.__webpack_require__.O (chunk loaded:23)
    at main.iframe.bundle.js:223
    at webpackJsonpCallback (jsonp chunk loading:557)
    at main.iframe.bundle.js:1
```

Some code inside Storybook's client also uses `require` and `module`, but when Webpack 5 sees a "module" type package it doesn't provide all that CommonJS functionality. Fortunately, we can trick Webpack a bit here.

By adding the file `.storybook/package.json` with just the contents `{}` (yes, an empty object), Webpack 5 won't see `"type": "module"` in the `package.json` at the root of your
project, and will instead run in a module-agnostic mode. This allows files to use ES Module style `import` and `export`, but also provides `require`, `module`, and so on for CommonJS code that might need it.

# Summing It Up

Finally, we have a Storybook configuration where everything works. I'm sure that a lot of these workarounds will no longer be needed as time goes on,
but for now I hope this helps you get a working setup.

To recap:

- Rename `.storybook/main.js` to `.storybook/main.cjs`.
- Remove references in `main.cjs` to `svelte.config.js`.
- Use Storybook's webpack 5 builder.
- Update the webpack configuration for Svelte.
- Set `fullySpecified: false` in the resolver configuration.
- Create `.storybook/package.json` just containing an empty object.

I've created [a GitHub repository with all these changes](https://github.com/dimfeld/svelte-storybook-workarounds) so that you can pull them into your own project.
