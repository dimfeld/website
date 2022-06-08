---
title: Hot Module Reloading for Content in Sveltekit
date: 2021-11-01
tags: Svelte,HMR,Vite,Sveltekit
---

I recently converted my website from [Sapper](https://sapper.svelte.dev/) to [SvelteKit](https://kit.svelte.dev).
SvelteKit uses the [Vite](https://https://vitejs.dev/) build tool, and one of Vite's great features is Hot Module Reloading,
or HMR, which can reload changed parts of a site without reloading the entire browser page.

This is great for speeding up developer productivity, and so I wanted to see if I could support HMR when changing the Markdown
and HTML files that make up the content of this site as well. Between Vite's HMR API and some SvelteKit
features, it was easier than I expected.

:::: note
Sometimes you may be able to just use Vite's [`import.meta.glob`](https://vitejs.dev/guide/features.html#glob-import) to accomplish this. If this doesn't fit your needs, read on!
::::

# Vite HMR Plugin

The first step is to add a build plugin into the Vite configuration. With SvelteKit, this configuration goes inside your `svelte.config.js`.

Vite plugins have a similar API to [Rollup](https://rollupjs.org/) plugins, but with some extra methods. The plugins provide
one or more hooks into the build process, and then Vite calls those hooks at the appropriate time.

First, our plugin provides a `configureServer` hook which tells Vite to watch the content directories for changes.
In Rollup this would be done in the `buildStart` hook and call `this.watch` to add the paths, but that doesn't work
for Vite dev mode. Instead, you call `server.watcher.add(path)`. In the snippet below, you can see I add three directories
to the watcher.

Adding these directories tells Vite to monitor them for changes and have them participate in the HMR process.
When a change occurs, Vite will call the [`handleHotUpdate`](https://vitejs.dev/guide/api-plugin.html#handlehotupdate) hook
with one argument of type `HmrContext`.

```typescript
interface HmrContext {
  file: string;
  timestamp: number;
  modules: Array<ModuleNode>;
  read: () => string | Promise<string>;
  server: ViteDevServer;
}
```

[The full documentation](https://vitejs.dev/guide/api-plugin.html#handlehotupdate) explains it in more detail,
but you can then return `modules`, filter down the list of modules to reload fewer modules, or send a custom event to
the client side using `server.ws.send`. In our case, we look for a path matching one of the content directories, and send
a custom client event. The full plugin is below.

```js
/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    vite: () => {
      plugins: [
        {
          name: 'watch-content',
          configureServer(server) {
            server.watcher.add(path.join(dirname, 'posts'));
            server.watcher.add(path.join(dirname, 'notes'));
            server.watcher.add(path.join(dirname, 'pkm-pages'));
          },
          handleHotUpdate(ctx) {
            let m = /(notes|posts|pkm-pages)\/(.*)\.(md|html)$/.exec(ctx.file);
            if (m) {
              let contentType = m[1];
              let id = m[2];

              // This is just a conversion from the directory
              // names to the URLs used in the site.
              if (contentType === 'pkm-pages') {
                contentType = 'notes';
              } else if (contentType === 'posts') {
                contentType = 'writing';
              }

              ctx.server.ws.send({
                type: 'custom',
                event: 'content-update',
                data: {
                  type: contentType,
                  id,
                },
              });

              // Return an empty module list since we
              // handled it manually.
              return [];
            }

            // Not an event we care about, so just do
            // the default behavior.
            return ctx.modules;
          },
        },
      ];
    },
  },
};
```

# The Client Side

Once we can send events to the client, we need to handle them and actually perform the reload. Happily, SvelteKit makes this
easy to do. Each article page uses a SvelteKit `load` function to fetch the content, and SvelteKit also lets you force these load
functions to rerun using the `invalidate` function.

Vite's HMR API is fairly complex, but for our case of just listening to a custom event, it's straightforward. We check for the
presence of `import.meta.hot` to see if Vite is running, and if so it's just a matter of adding the event
listener for the custom `content-update` event.

```svelte
<script>
  import { invalidate } from '$app/navigation';

  if (import.meta.hot) {
    import.meta.hot.on('content-update', (data) => {
      if (data.type === 'notes') {
        invalidate('/notes/list.json');
        invalidate('/notes/tags.json');
        invalidate(`/notes/note/${data.id}.json`);
      } else if (data.type === 'writing') {
        invalidate('/writing/list.json');
        invalidate(`/writing/${data.id}.json`);
      }
    });
  }
</script>
```

Here I just placed a single event listener at the root `__layout.svelte` file of the site, which examines the event and
invalidates all the relevant endpoints. Larger sites would probably want to break this out to have each component manage its
own HMR event handling, but the concept is the same.

SvelteKit internally tracks the URLs fetched by each `load` function, and to `invalidate` then compares its argument to the tracked
URLs, and reruns any `load` functions on active pages or layout components that match. And that's it!
