<script>
  import { onDestroy } from 'svelte';
  import { formatDistanceToNowStrict } from 'date-fns';

  export let prefix = 'You have been reading this page for ';
  export let suffix = '.';

  let startTime = new Date();
  let since = '0 seconds';
  let timer = setInterval(() => {
    since = formatDistanceToNowStrict(startTime);
  }, 1000);
  onDestroy(() => {
    clearTimeout(timer);
  });

  $: output = [prefix, since, suffix].filter(Boolean).join('');
</script>

<div class="font-sans mx-auto p-4 w-5/6 bg-gray-200 border border-teal-700">
  {output}
</div>
