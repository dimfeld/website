<script>
  import { createEventDispatcher, getContext } from 'svelte';

  const dispatch = createEventDispatcher();

  const activeTags = getContext('activeTags');
  const tagList = getContext('tagList');

  const selectedDivClasses =
    'group flex items-center px-3 py-2 text-sm leading-5 font-medium text-gray-900 sm:rounded-md bg-gray-200 hover:text-gray-900 focus:outline-none focus:bg-gray-300 transition ease-in-out duration-150 hover:no-underline';
  const unselectedDivClasses =
    'group flex items-center px-3 py-2 text-sm leading-5 font-medium text-gray-600 sm:rounded-md hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:text-gray-900 focus:bg-gray-200 transition ease-in-out duration-150 hover:no-underline';

  const selectedBubbleClasses =
    'ml-auto inline-block py-0.5 px-3 text-xs leading-4 rounded-full bg-gray-50 group-focus:bg-gray-100 transition ease-in-out duration-150';
  const unselectedBubbleClasses =
    'ml-auto inline-block py-0.5 px-3 text-xs leading-4 rounded-full text-gray-600 bg-gray-200 group-hover:bg-gray-200 group-focus:bg-gray-300 transition ease-in-out duration-150';
</script>

<nav class="flex flex-col h-full">
  <a
    href="/notes"
    on:click={() => dispatch('change', null)}
    class={$activeTags.length === 0 ? selectedDivClasses : unselectedDivClasses}>
    <span class="truncate group-hover:underline">All Notes</span>
  </a>
  {#each tagList.map((t) => ({
    ...t,
    selected: $activeTags.includes(t.id),
  })) as tag (tag.id)}
    <a
      href="/notes?tag={tag.id}"
      aria-roledescription="Notes tagged {tag.id}"
      on:click={() => dispatch('change', tag.id)}
      class="mt-1 {tag.selected ? selectedDivClasses : unselectedDivClasses}">
      <span class="truncate group-hover:underline">{tag.label}</span>
      <span
        class={tag.selected ? selectedBubbleClasses : unselectedBubbleClasses}>
        {tag.posts.length}
      </span>
    </a>
  {/each}
</nav>
