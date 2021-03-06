---
title: Easy Optimistic Updates with svelte-query
date: 2021-02-15
tags: Svelte
cardImage: svelte_query_mutations_card.png
cardImageFilter: opacity(60%) brightness(150%)
---


I've been playing around with the [svelte-query](https://sveltequery.vercel.app/) library lately and I've enjoyed its approach to caching and integrating mutations with queries. I've especially liked how its hooks make **optimistic updates** easy. (Note that this article should also apply to react-query with little change.)

# Optimistic Updates

Traditionally, a web application implements mutations by sending a request to the server, waiting for the result, and then updating the UI appropriately.

This works fine, but the rise of client-side rendering allows for some nice tricks to make our applications more responsive. The optimistic update technique anticipates success and updates the interface immediately to reflect the anticipated state, even before the server has responded with the confirmation.

This makes for a snappy UI, but it requires extra care when handling errors. With the traditional method of waiting for the server to respond, we just show an error and then don’t have anything more to do. Here, we not only need to show an error, but also undo the optimistic update so that the display accurately reflects the state once again.

# Base Implementation

The svelte-query documentation describes how to implement optimistic updates. This block of code is taken from [the example](https://sveltequery.vercel.app/guides/optimistic-updates).

```javascript
import { useQueryClient, useMutation } from '@sveltestack/svelte-query';
const queryClient = useQueryClient();
useMutation(updateTodoFn, {
  // When mutate is called:
  onMutate: async (newTodo) => {
    // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
    await queryClient.cancelQueries('todos');

    // Snapshot the previous value
    const previousTodos = queryClient.getQueryData('todos');

    // Optimistically update to the new value
    queryClient.setQueryData('todos', (old) => [...old, newTodo]);

    // Return a context object with the snapshotted value
    return { previousTodos };
  },
  // If the mutation fails, use the context returned from onMutate to roll back
  onError: (err, newTodo, context) => {
    queryClient.setQueryData('todos', context.previousTodos);
  },
  // Always refetch after error or success:
  onSettled: () => {
    queryClient.invalidateQueries('todos');
  },
});
```

This works well, but can get a bit inconvenient to write on every single mutation. We can abstract this out into a function to make it easier to enable optimistic updates on multiple mutations.

```js
function mutationOptions({ key }) {
  let queryClient = useQueryClient();
  return {
    onMutate: async (newData) => {
      await queryClient.cancelQueries(key);
      let existingData = client.getQueryData(key);
      client.setQueryData((existing) => ({
        ...existing,
        [newData.id]: {
          ...newData,
          isUpdating: true,
        }
      });

      return { previousData };
    },
    onSettled: (data, error, variables, context) => {
      if(error) {
        queryClient.setQueryData(key, context.previousData);
        // In real code, also notify the user somehow.
      } else {
        // It succeeded, so just unset isUpdating.
        client.setQueryData((existing) => ({
          ...existing,
          [data.id]: data
        });
      }
    }
  };
}
```

Here we also have updated the function to set an `isUpdating` flag on an item, so that the UI can mark it specially until the update is complete.

# Updating Multiple Queries

Sometimes a piece of data may reside in multiple queries. This mostly comes up when we have a query for a collection of items as well as a query for each individual item, and the svelte-query documentation provides an [example of this](https://sveltequery.vercel.app/guides/initial-query-data#initial-data-from-cache). In this case, the optimistic update should update the item in both places.

The really nice thing about handling it this way is that we also automatically handle updating the data for real in both places, so there’s no risk of them getting out of sync.

Since not every mutation will need to update multiple queries, we can change `mutationOptions` to take a list of update functions, and also provide functions to handle the common cases.

Here's a Svelte REPL example demoing the concept.

<div data-component="Repl" data-prop-id="8b7315b62b874c3f8079d2b1d4bedc07">

</div>

And now for a detailed walkthrough of the code.

::: side-by-side

First we just import everything needed. I was using the `ky-universal` package for fetching in the project I pulled this file from, so I import its error type here as well.

```typescript
import {
  QueryClient,
  QueryKey,
  UseMutationOptions,
  useQueryClient,
} from '@sveltestack/svelte-query';
import { HTTPError } from 'ky-universal';

```

We'll assume that any object used by this system has an `id` key, and that all the collections are objects where the key is the `id` of the object.

Other systems may use arrays for this, so you would need to change the code a bit in that case.

```typescript
export interface HasId {
  id: string | number;
}

```

Our abstraction allows the use of one or more optimistic update functions. Each one returns a `DataRestorer`, a function that will restore the original data in case of an error.

```typescript
export type DataRestorer = () => void;

```

This function is for updating single objects, where an example `QueryKey` might be `['todos', 5]`. Since the entire data for the query is just the object, there isn't much to do here.

```typescript
export async function optimisticUpdateSingleton<T extends HasId>(
  client: QueryClient,
  key: QueryKey,
  data: T,
  isUpdating: boolean
): Promise<DataRestorer> {
  await client.cancelQueries(key);
  let original = client.getQueryData(key);
  client.setQueryData(key, { ...data, isUpdating });
  return () => client.setQueryData(key, original);
}

```

This one is for the case we saw earlier where we are updating a single object in a collection of objects.

```typescript
export async function optimisticUpdateCollectionMember<T extends HasId>(
  client: QueryClient,
  key: QueryKey,
  data: T,
  isUpdating: boolean
): Promise<DataRestorer> {
  await client.cancelQueries(key);
  let overall = client.getQueryData(key) || {};
  let originalItem = overall[data.id];

  client.setQueryData(key, {
    ...overall,
    [data.id]: {
      ...data,
      isUpdating,
    },
  });

```

The restorer function here puts the original item back into the data collection, or
removes the key completely if the item was not present before the mutation.

```typescript
  return () => client.setQueryData(key, (overall) => {
    if(originalItem) {
      return {
        ...overall,
        [data.id]: originalItem,
      };
    } else {
      // The item was absent in the original data, so just delete it.
      let { [data.id]: _, ...rest } = overall;
      return rest;
    }
  });
}

```

And finally, a function that can be used for deletion mutations. This one optimistically deletes the object from the collection, and the restore function puts it back.

```typescript
export async function optimisticDeleteCollectionMember<T extends HasId>(
  client: QueryClient,
  key: QueryKey,
  id: string,
  _isDeleting: boolean
): Promise<DataRestorer> {

await client.cancelQueries(key);
  let overall = client.getQueryData(key);
  let { [id]: originalItem, ...rest } = overall ?? {};
  client.setQueryData(key, rest);

  // The restore function puts the item back.
  return () => client.setQueryData((overall) => ({
    ...overall,
    [id]: originalItem,
  }));
}

```

Each of the above functions can be used with our new version of `mutationOptions`. Here we describe the parameters that it takes.

`svelte-query` uses four generic types:

- `DATA` is the data returned from the fetch function when calling the mutation.
- `VARIABLES` is the data sent to the mutation.
- `ERROR` is the error type from the fetching function. Here we just hardcode that to `HTTPError`.
- `CONTEXT` is data returned from the `onMutate` hook for use by the other mutation hooks.

```typescript
export interface MutationOptions<
  DATA extends HasId,
  VARIABLES = DATA,
  CONTEXT extends { previousData?: DataRestorer[] } = {
    previousData?: DataRestorer[];
  }
> {
  /** Invalidate and refetch these query keys after the mutation is done. */
  invalidate?: (item: VARIABLES) => QueryKey[];
  /** A function that uses one or more of the optimisitic update functions above. */
  optimisticUpdates?: (
    client: QueryClient,
    item: VARIABLES,
    isUpdating: boolean
  ) => Promise<DataRestorer[]>;

```

We still want to allow mutations to have their own hooks, so we have `onMutate` and `onSettled` options here. The hooks inside `mutationOptions` will call these as well, if they are provided.

```typescript
  onMutate?: UseMutationOptions<
    DATA,
    HTTPError,
    VARIABLES,
    Omit<CONTEXT, 'previousData'>
  >['onMutate'];

  onSettled?: UseMutationOptions<DATA, HTTPError, VARIABLES, CONTEXT>['onSettled'];
}

```

And finally, our function. Aside from the extra Typescript syntax, this doesn't look too different from what we had above.

```typescript
export function mutationOptions<
  DATA extends HasId,
  CONTEXT extends { previousData?: DataRestorer[] } = {
    previousData?: DataRestorer[];
  }
>(
  options: MutationOptions<DATA, DATA, CONTEXT>
): Partial<UseMutationOptions<DATA, HTTPError, DATA, CONTEXT>> {
  let queryClient = useQueryClient();

  return {
    async onMutate(data: DATA) {
      let previousData: DataRestorer[] | undefined;
```

Perform the optimistic update. We pass `true` to the function to indicate tht the update is happening. The functions above use this to set the `isUpdating` flag on the object.

```typescript
      if (options.optimisticUpdates) {
        previousData = await options.optimisticUpdates(queryClient, data, true);
      }
```

Call the `onMutate` function from the options, if provided, and return its context along with `previousData`.

```typescript
      let c = options.onMutate ? await options.onMutate(data) : {};
      return { ...c || {}, previousData };
    },
    async onSettled(data, error, variables, context) {
```

In case of an error, iterate through our `previousData` and set each one back to the old value.

```typescript
      if(error && context?.previousData) {
        // Undo the optimistic update
        for (let restorer of context.previousData) {
            restorer();
        }
```

If it worked, then call the optimistic update functions again, but this time with the new data and with a false value for `isUpdating`. This assumes that the fetch function for the mutation returns a copy of the updated data. If not, you can just use `variables` instead or do whatever is correct for your application.

```typescript
      } else if(options.optimisticUpdates) {
        await options.optimisticUpdates(queryClient, data, false);
      }
```

And if there are any other related keys to invalidate, we do that here. In general, I prefer to not invalidate the collection
being updated, since it can lead to weird UI race conditions when updating multiple items at once.

```typescript
      if(options.invalidate) {
        for (let key of options.invalidate(variables)) {
          queryClient.invalidateQueries(key);
        }
      }

      return options.onSettled?.(data, error, variables, context);
    },
  };
}
```

:::

With all this in place, it's relatively simple to create a mutation with optimistic updates for all the relevant queries.

```typescript
export function updateTodoMutation() {
  return useMutation(
    (todo: Todo) =>
      ky.put(`api/todos/${todo.id}`, { json: todo }).json<Todo>(),
    mutationOptions({
      optimisticUpdates:
        (queryClient: QueryClient, todo: Todo, isUpdating: boolean) =>
          Promise.all([
            optimisticUpdateCollectionMember(queryClient, 'todos',
              todo, isUpdating),
            optimisticUpdateSingleton(queryClient, ['todos', todo.id],
              todo, isUpdating),
          ]),
    })
  );
}
```

Here the `optimisticUpdates` function just calls both `optimisticUpdateSingleton` and `optimisticUpdateCollectionMember` with the necessary parameters. There's still a bit of boilerplate, but doing it this way makes it easy
to add some custom behavior for a special case.

Deleting an item works similarly. We make a mutation in much the same way, but use `optimisticDeleteCollectionMember` instead.

An alternative version of the deletion function might add an `isDeleting` flag to the item, and then only actually remove it once the server confirms the deletion. This allows the application to look responsive, but prevents things from jumping around too much if a deletion fails.

Both approaches are valid; it mostly depends on how likely it is for the server to reject a deletion in your particular application.

So with that, we have a reusable system for building optimistic updates into our queries. With such a system in place, it's easy to then add additional functionality to all mutations, such as notifications or error reporting.
