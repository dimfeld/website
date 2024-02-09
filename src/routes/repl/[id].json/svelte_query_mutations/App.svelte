<script>
  import {
    QueryClient,
    useMutation,
    useQuery,
  } from '@sveltestack/svelte-query@1.1.0';
  import {
    mutationOptions,
    optimisticUpdateCollectionMember,
  } from './mutations';
  import { setContext, onMount } from 'svelte';

  let todoBackendState = {
    project: {
      id: 'project',
      done: false,
      text: 'Start the project',
      time: 16,
    },
    lunch: {
      id: 'lunch',
      done: false,
      text: 'Eat lunch',
      time: 12,
    },
    coffee: {
      id: 'coffee',
      done: false,
      text: 'Get coffee',
      time: 9,
    },
    wall: {
      id: 'wall',
      done: false,
      text: 'Stare at the wall',
      time: 10,
    },
  };

  let client = new QueryClient();

  // This just emulates the QueryClientProvider without needing to make
  // another component to go inside it.
  setContext('queryClient', client);
  onMount(() => {
    client.mount();
    return () => client.unmount();
  });

  let shouldFail = false;
  function doUpdate(newTodo) {
    let succeed = !shouldFail;
    return new Promise((resolve, reject) => {
      // Simulate slow network
      let delay = Math.random() * 2000 + 1000;
      setTimeout(() => {
        if (succeed) {
          todoBackendState[newTodo.id] = newTodo;
          resolve(newTodo);
        } else {
          reject(new Error('Update failed!'));
        }
      }, delay);
    });
  }

  let updateTodo = useMutation(
    doUpdate,
    mutationOptions({
      optimisticUpdates: (queryClient, todo, isUpdating) =>
        Promise.all([
          optimisticUpdateCollectionMember(
            queryClient,
            'todos',
            todo,
            isUpdating
          ),
        ]),
    })
  );

  function toggleDone(todo, newDone) {
    let newValue = {
      ...todo,
      done: newDone,
    };

    $updateTodo.mutate(newValue);
  }

  let todos = useQuery('todos', () => todoBackendState);

  $: todoData = Object.values($todos.data || {}).sort(
    (a, b) => a.time - b.time
  );
</script>

<p>
  This example shows the usefulness of optimistic updates. Here, the update
  function is intentionally slowed down to simulate network delays. Items that
  have been updated optimistically but not yet confirmed by the server are
  highlighted in yellow.
</p>
<p>
  This example makes no attempt to handle fast toggling of items, so that may
  cause unexpected behavior.
</p>

<p>
  <label>
    <input type="checkbox" bind:checked={shouldFail} /> Check this box to make the
    updates fail.
  </label>
</p>

<section>
  <ol>
    {#each todoData as todo}
      <li class:updating={todo.isUpdating}>
        <label>
          <input
            type="checkbox"
            checked={todo.done}
            on:input={(e) => toggleDone(todo, e.target.checked)} />
          {todo.text} - {todo.time}:00
        </label>
      </li>
    {/each}
  </ol>

  <h4 class="status">
    {#if $updateTodo.isLoading}
      Saving...
    {:else if $updateTodo.isError}
      Error: {$updateTodo.error.message}
    {/if}
  </h4>
</section>

<pre>
Raw data from the query:
{JSON.stringify($todos.data, null, 2)}
</pre>

<style>
  section {
    position: relative;
    display: flex;
    max-width: 40ch;
  }

  section > ol {
    flex: 1;
  }

  .updating {
    background: yellow;
  }

  .status {
    margin-top: 0;
  }
</style>
