<script>
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  function updater({ getKey, add, remove, update, isEqual }) {
    var activeData = new Map();
    return (newData) => {
      let newDataKeys = new Set(newData.map(getKey));
      for (let key of activeData.keys()) {
        if (!newDataKeys.has(key)) {
          remove(key);
          activeData.delete(key);
        }
      }

      for (let data of newData) {
        let key = getKey(data);
        newDataKeys.add(key);

        let existingItem = activeData.get(key);
        if (existingItem) {
          // Some check for if we need to push an update to the API,
          // if necessary.
          if (update && !isEqual(existingItem, data)) {
            update(data);
            activeData.set(key, data);
          }
        } else {
          activeData.set(key, data);
          add(key, data);
        }
      }
    };
  }

  let commands = [];
  function logCommand(type, key) {
    commands.unshift(`${type} ${key}`);
    commands = commands.slice(0, 10);
  }

  let values = new Set();
  let updateItems = updater({
    getKey: (item) => item,
    add: (key, data) => {
      logCommand('add', key);
      values.add(key);
      values = values;
    },
    remove: (key) => {
      logCommand('remove', key);
      values.delete(key);
      values = values;
    },
  });

  function filteredItems(f) {
    return ['a', 'b', 'c', 'd', 'e', 'f', 'g'].filter((value) =>
      f.includes(value)
    );
  }

  let filters = 'abcdefg';
  $: activeItems = filteredItems(filters);
  $: updateItems(activeItems);
</script>

<p>
  This is a very contrived, simple example of detecting changes in state and
  translating them to <em>add</em> and <em>remove</em> commands for an API.
</p>

<label>
  Type to filter items
  <input type="text" bind:value={filters} />
</label>

<div>
  Active Items: {activeItems}
</div>

<div style="display:flex;margin-top:1rem">
  <div style="width:50%">
    <p>API State</p>
    <ul>
      {#each Array.from(values).sort() as s (s)}
        <li
          animate:flip={{ duration: 300 }}
          transition:fade|global={{ duration: 300 }}>
          {s}
        </li>
      {/each}
    </ul>
  </div>

  <div>
    <p>Commands sent to API</p>

    {#each commands as c}
      <div>{c}</div>
    {/each}
  </div>
</div>
