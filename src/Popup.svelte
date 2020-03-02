<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  export let visible = false;
  export let triggerElement = undefined;

  const dispatch = createEventDispatcher();

  export let style = '';
  let classNames = '';
  export { classNames as class };

  function clickOutside(node, { ignore, cb }) {
    var handleOutsideClick = ({ target }) => {
      if (!node.contains(target) && (!ignore || !ignore.contains(target))) {
        cb();
      }
    };

    window.addEventListener('click', handleOutsideClick);
    return {
      destroy: () => window.removeEventListener('click', handleOutsideClick),
    };
  }
</script>

{#if visible}
  <div
    use:clickOutside={{ ignore: triggerElement, cb: () => (visible = false) }}
    transition:fade={{ duration: 200 }}
    {style}
    class="absolute z-20 pb-4 {classNames}">
    <div class="bg-white rounded-md shadow-lg">
      <slot />
    </div>
  </div>
{/if}
