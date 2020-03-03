<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  export let visible = false;
  export let triggerElement = undefined;

  const dispatch = createEventDispatcher();

  export let style = '';
  export let containerClass = '';
  let classNames = '';
  export { classNames as class };

  function clickOutside(node, cb) {
    var handleOutsideClick = ({ target }) => {
      if (
        node.offsetParent !== null &&
        !node.contains(target) &&
        (!triggerElement || !triggerElement.contains(target))
      ) {
        cb();
      }
    };

    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('touchend', handleOutsideClick);
    return {
      destroy: () => {
        window.removeEventListener('click', handleOutsideClick);
        window.removeEventListener('touchend', handleOutsideClick);
      },
    };
  }

  function hide() {
    visible = false;
    dispatch('close');
  }
</script>

{#if visible}
  <div
    use:clickOutside={hide}
    transition:fade={{ duration: 200 }}
    {style}
    class="absolute z-20 pb-4 flex flex-col {containerClass}">
    <div class="bg-white rounded-md shadow-lg {classNames}">
      <slot />
    </div>
  </div>
{/if}
