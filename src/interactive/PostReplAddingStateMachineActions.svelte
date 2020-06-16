<script>
  import Repl from './ReplWrapper.svelte';
  import components from './adding-state-machine-actions-repl-source.json';

  const data = {
    title: 'State Machine with Actions - The Final Result',
    components,
  };
</script>

<Repl {data} />
