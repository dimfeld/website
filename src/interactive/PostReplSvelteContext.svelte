<script>
  import Repl from './ReplWrapper.svelte';

  import storeApp from './svelte-context-src/store-app.txt?raw';
  import storeChild from './svelte-context-src/store-child.txt?raw';
  import storeGrandchild from './svelte-context-src/store-grandchild.txt?raw';

  import contextAfterInitApp from './svelte-context-src/context-after-init-app.txt?raw';
  import contextAfterInitChild from './svelte-context-src/context-after-init-child.txt?raw';

  import preventingKeyInterferenceApp from './svelte-context-src/preventing-key-interference-app.txt?raw';
  import preventingKeyInterferenceChild from './svelte-context-src/preventing-key-interference-child.txt?raw';
  import preventingKeyInterferenceContext from './svelte-context-src/preventing-key-interference-context.txt?raw';

  import storeSeparateFileApp from './svelte-context-src/store-separate-file-app.txt?raw';
  import storeSeparateFileChild from './svelte-context-src/store-separate-file-child.txt?raw';
  import storeSeparateFileStore from './svelte-context-src/store-separate-file-store.txt?raw';

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
        {
          type: 'svelte',
          name: 'Grandchild',
          source: storeGrandchild,
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

<Repl data={presets[preset]} id={preset} expandedWidth={true} height="600px" />
