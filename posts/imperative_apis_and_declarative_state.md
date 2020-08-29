---
title:  Clean integration of state managers with Vanilla JS libraries
summary: Updating Imperative APIs from Declarative State
frontPageSummary: updating imperative APIs from declarative state
date: 2020-08-28
cardImage: imperative-apis-and-declarative-state.png
---

![Header image](/images/imperative-apis-and-declarative-state.png)

Declarative and derived state management techniques make it a lot easier to create robust applications. Instead of a lot of error-prone updating and checking logic, each component just recreates its state each time something changes.

But sometimes you need to interface with imperatively-controlled libraries, such as Leaflet maps. These libraries want to know specifically what to add and remove, which can be frustrating when you don't have an exact indication of what changed between the previous and current iterations of the state.

Nearly every library that renders in the browser is doing things imperatively at some level. If the code uses a modern component framework, the framework itself may be managing that behavior. For example, Svelte's `#each` template handles changes in an array (the declarative state) by checking for changes and updating only the modified DOM elements (the imperative API).

But sometimes we can't rely on the lower levels of abstraction to deal with that translation, and so we have to do it ourselves. This comes up most often when interfacing with "vanilla" Javascript UI libraries that expect to be controlled by function calls.

It can feel unnatural and become messy to convert our declarative state into imperative function calls, but it can be quite manageable if you're methodical about it.

# Don't recreate the state every time

The easiest way is to take inspiration from the declarative style of state management. Just clear the imperative API's state and then add everything from the new state on every update. Many imperative APIs have a `clear` function that makes it easy to do.

```javascript
api.clear();
for(let item of newData) {
  api.add(item);
}
```

This sort of works, and in some situations may even be acceptable. But it has downsides:

- Removing and adding objects that haven't changed may cause them to flash annoyingly.
- The imperative API loses any internal state about objects.
- It's inefficient when you have a lot of objects and only a few need to actually change.

I do this sometimes in the experimental "just get it working" phase but I usually wouldn't recommend shipping code that works this way.

# Only update what changed

We can't avoid leaking imperative calls into our code somewhere, but we can make it reasonable to deal with.

The trick is to isolate the interaction with the imperative API to a single place, which runs whenever any of the declarative state has changed. This function either keeps its own record of what currently exists, or queries the imperative API if possible, and then reconciles the existing state with the new state.

```javascript
var activeData = new Map();
function update(newData) {
  let newDataKeys = new Set(newData.map((item) => item.key);
  for(let key of activeData.keys()) {
    if(!newDataKeys.has(key)) {
      api.remove(key);
      activeData.delete(key);
    }
  }

  for(let {key, data} of newData) {
    newDataKeys.add(key);
    let existingItem = activeData.get(key);
    if(existingItem) {
      // Some check for if we need to push an update to the API,
      // if necessary.
      if(!isEqual(existingItem, data)) {
        api.update(key, data);
        activeData.set(key, data);
      }
    } else {
      activeData.set(key, data);
      api.add(key, data);
    }
  }
}

// In Svelte, something like this.
$: update(filteredItems(filters));
```

The possible downside of this technique is that whenever anything changes, you need to iterate over every item in the old and new data collections. Realistically, this is rarely an issue, but with many thousands of items in the state you may need to manage it in a more bespoke fashion if you encounter performance problems.

As always, if you suspect that the reconciliation is causing performance issues, a quick visit to the DevTools profiler should make it pretty clear.

# Make it Reusable

It's pretty simple to refactor this into a reusable function, so that we have something ready to reach for next time too. This function handles all the details of syncing the data, and you just need to tell it how to identify items and add or remove them from the API.

```javascript
function updater({ getKey, add, remove, update, isEqual }) {
  var activeData = new Map();
  return (newData) => {

    let newDataKeys = new Set(newData.map(getKey));
    for(let key of activeData.keys()) {
      if(!newDataKeys.has(key)) {
        remove(key);
        activeData.delete(key);
      }
    }

    for(let data of newData) {
      let key = getKey(data);
      newDataKeys.add(key);

      let existingItem = activeData.get(key);
      if(existingItem) {
        // Some check for if we need to push an update to the API,
        // if necessary.
        if(update && !isEqual(existingItem, data)) {
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

let updateItems = updater({
  getKey: (item) => item.key,
  add: ({key, data}) => api.add(key, data),
  remove: (key) => api.remove(key),
  // These are optional
  update: (key,data) => api.update(key, data),
  isEqual: (a, b) => a.data == b.data,
});

$: activeItems = filteredItems(filters);
$: updateItems(activeItems);
```

Here's a simple example of this in action:

<div data-component="Repl" data-prop-id="7df044e9afe947c6bc62cee60f426f73"></div>
