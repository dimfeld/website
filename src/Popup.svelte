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

  function clickOutside(node, { ignore, cb }) {
    console.log(ignore);
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

  function hide() {
    visible = false;
    dispatch('close');
  }
</script>

{#if visible}
  <div
    use:clickOutside={{ ignore: triggerElement, cb: hide }}
    transition:fade={{ duration: 200 }}
    {style}
    class="absolute z-20 pb-4 {containerClass}">
    <div class="bg-white rounded-md shadow-lg {classNames}">
      <slot />
    </div>
  </div>
{/if}
