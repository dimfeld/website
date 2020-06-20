<script>
  import Repl from './ReplWrapper.svelte';

  import storeApp from './svelte-context-src/store-app.txt';
  import storeChild from './svelte-context-src/store-child.txt';

  import contextAfterInitApp from './svelte-context-src/context-after-init-app.txt';
  import contextAfterInitChild from './svelte-context-src/context-after-init-child.txt';

  import preventingKeyInterferenceApp from './svelte-context-src/preventing-key-interference-app.txt';
  import preventingKeyInterferenceChild from './svelte-context-src/preventing-key-interference-child.txt';
  import preventingKeyInterferenceContext from './svelte-context-src/preventing-key-interference-context.txt';

  import storeSeparateFileApp from './svelte-context-src/store-separate-file-app.txt';
  import storeSeparateFileChild from './svelte-context-src/store-separate-file-child.txt';
  import storeSeparateFileStore from './svelte-context-src/store-separate-file-store.txt';

  export let preset;

  const presets = {
    context_after_init: {
      title: 'Accessing Context Too Late',
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: contextAfterInitApp,
        },
        {
          type: 'svelte',
          name: 'Child',
          source: contextAfterInitChild,
        },
      ],
    },
    context_key: {
      title: 'Preventing Key Interference',
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: preventingKeyInterferenceApp,
        },
        {
          type: 'svelte',
          name: 'Child',
          source: preventingKeyInterferenceChild,
        },
        {
          type: 'js',
          name: 'context',
          source: preventingKeyInterferenceContext,
        },
      ],
    },
    store_in_context: {
      title: 'Using a Store in the Context',
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: storeApp,
        },
        {
          type: 'svelte',
          name: 'Child',
          source: storeChild,
        },
      ],
    },
    store_separate_file: {
      title: 'Global Store in a Separate File',
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: storeSeparateFileApp,
        },
        {
          type: 'svelte',
          name: 'Child',
          source: storeSeparateFileChild,
        },
        {
          type: 'js',
          name: 'store',
          source: storeSeparateFileStore,
        },
      ],
    },
  };
</script>

<Repl data={presets[preset]} expandedWidth={false} height="600px" />
