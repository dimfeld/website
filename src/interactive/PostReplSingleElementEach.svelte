<script>
  import Repl from './ReplWrapper.svelte';
  import app from './svelte-single-element-each.txt';

  const data = {
    title: 'Updating lists with and without the #each hack',
    components: [
      {
        name: 'App',
        type: 'svelte',
        source: app,
      },
    ],
  };
</script>

<Repl {data} id="single_element_each" expandedWidth={true} />
