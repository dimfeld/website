<script>
  import Repl from './ReplWrapper.svelte';

  export let preset;

  const presets = {
    basic: {
      title: 'Basic Example',
      components: [
        {
          type: 'svelte',
          name: 'App',
          source: '<p>abc</p>',
        },
      ],
    },
  };
</script>

<Repl data={presets[preset]} />
