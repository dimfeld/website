import { useQueryClient } from '@sveltestack/svelte-query@1.1.0';

export async function optimisticUpdateSingleton(client, key, data, isUpdating) {
    await client.cancelQueries(key);
    let thisOne = client.getQueryData(key);
    client.setQueryData(key, { ...data, isUpdating });
    return () => client.setQueryData(key, thisOne);
}

export async function optimisticUpdateCollectionMember(client, key, data, isUpdating) {
    await client.cancelQueries(key);
    let overall = client.getQueryData(key) || {};
		let originalItem = overall[data.id];
	
		console.log(`Updating ${data.id}`);
    client.setQueryData(key, {
        ...overall,
        [data.id]: {
            ...data,
            isUpdating,
        },
    });
	
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

export async function optimisticDeleteCollectionMember(client, key, id, _isDeleting) {
    await client.cancelQueries(key);
    let overall = client.getQueryData(key);
    let { [id]: originalItem, ...rest } = overall ?? {};
    client.setQueryData(key, rest);
			
	  // The restore function puts the item back.
    return () => client.setQueryData((overall) => ({
			...overall,
			[id]: originalItem,
		}))
}

export function mutationOptions(options) {
    let queryClient = useQueryClient();
    return {
        async onMutate(variables) {
            let previousData;
            if (options.optimisticUpdates) {
                previousData = await options.optimisticUpdates(queryClient, variables, true);
            }
            let c = options.onMutate ? await options.onMutate(variables) : {};
            return { ...c || {}, previousData };
        },
        async onSettled(data, error, variables, context) {
            if (error && context?.previousData) {
                // Undo the optimistic update
                for (let restorer of context.previousData) {
                    restorer();
                }
            } else if (options.optimisticUpdates) {
								console.log(`Done ${variables.id}`);
                await options.optimisticUpdates(queryClient, variables, false);
            }
					
            if(options.invalidate) {
							for (let key of options.invalidate(variables)) {
								queryClient.invalidateQueries(key);
							}
						}
            return options.onSettled?.(data, error, variables, context);
        },
    };
}
