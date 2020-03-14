---
title: Tailwind UI in Svelte
date: 2020-03-13
---

The [Tailwind UI](https://tailwindui.com) dynamic code is written using [Alpine.js](https://github.com/alpinejs/alpine/), so most of the integration effort goes into translating the Alpine.js code to Svelte.

# Conditional Showing of Elements

Alpine:
```html
<div x-data="{open: true}">
    <div x-show="open">...</div>
</div>
```

Svelte:
```html
<script>
  let open = true;
</script>

<div>
    {#if open}
        <div>...</div>
    {/if}
</div>

```

# Conditional Classes

Alpine:
```html
<div :class="{'block': open, 'hidden': !open}">...</div>
```

Svelte:
```html
<div class:block={open} class:hidden={!open}>...</div>
```

# Event Handlers

## Button Click

Alpine:
```html
<button @click="open = !open">...</button>
```

Svelte:
```html
<button on:click={() => open = !open}>...</button>
```

## Click Outside

Alpine:
```html
<div @click.away="open = false">
    ...
    <div x-show={open}>...</div>
</div>
```

Svelte ([REPL](https://svelte.dev/repl/dae848c2157e48ab932106779960f5d5?version=3.19.2)):
```html

<script>
function clickOutside(node, { enabled: initialEnabled, cb }) {
    const handleOutsideClick = ({ target }) => {
      if (!node.contains(target)) {
        cb();
      }
    };

    function update({enabled}) {
      if (enabled) {
        window.addEventListener('click', handleOutsideClick);
      } else {
        window.removeEventListener('click', handleOutsideClick);
      }
    }

    update(initialEnabled);
    return {
      update,
      destroy() {
        window.removeEventListener( 'click', handleOutsideClick );
      }
    };
  }

  let open = true;
</script>

<div use:clickOutside={{ enabled: open, cb: () => open = false }}>
   <button>...</button>
   {#if open}
    <div>
      ...
    </div>
  {/if}
</div>

```

## Key Press

Alpine:
```html
<div @keydown.window.escape="open = false">
    ...
</div>
```

Svelte:
```html
<script>
    function handleEscape({key}) {
        if (key === 'Escape') {
            open = false;
        }
    }
</script>

<svelte:window on:keyup={handleEscape} />

{#if open}
<div>...</div>
{/if}
```

This could also be done with a `use:` action similar to the Click Outside example.

# Transitions

Alpine
```html
<div
    x-transition:enter="transition ease-out duration-100"
    x-transition:enter-start="transform opacity-0 scale-95"
    x-transition:enter-end="transform opacity-100 scale-100"
    x-transition:leave="transition ease-in duration-75"
    x-transition:leave-start="transform opacity-100 scale-100"
    x-transition:leave-end="transform opacity-0 scale-95">
 ...
</div>
```

Svelte
```html
<script>
  import { scale } from 'svelte/transition';
  import { cubicIn, cubicOut } from 'svelte/easing';
</script>

<div in:scale={{ duration: 100, start: 0.95, easing: cubicOut }}
     out:scale={{ duration: 75, start: 0.95, easing: cubicIn }}>
  Start is the scale value divided by 100.
</div>
```
