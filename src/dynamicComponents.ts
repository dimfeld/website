import { SvelteComponent } from 'svelte';

import ReadingSince from './interactive/ReadingSince.svelte';
import Slider from './interactive/Slider.svelte';
import Roller from './interactive/Roller.svelte';
import PostReplSvelteContext from './interactive/PostReplSvelteContext.svelte';

const components = {
  ReadingSince,
  Slider,
  Roller,
  PostReplSvelteContext,
};

function instantiateComponent(element: Element) {
  let attrs = element.getAttributeNames();

  let component: typeof SvelteComponent | null = null;
  let props: { [key: string]: string } = {};
  for (let attr of attrs) {
    let value = element.getAttribute(attr);
    if (!value) {
      continue;
    }

    if (attr === 'data-component') {
      component = components[value];
    } else if (attr.startsWith('data-prop-')) {
      let propName = attr.slice('data-prop-'.length);
      props[propName] = value;
    }
  }

  if (!component) {
    return;
  }

  let instance = new component({
    target: element,
    props,
  });

  return instance;
}

export default function instantiateComponents() {
  let components: SvelteComponent[] = [];
  let divs = document.querySelectorAll('[data-component]');
  for (let div of divs) {
    let instance = instantiateComponent(div);
    if (instance) {
      components.push(instance);
    }
  }

  return () => {
    for (let component of components) {
      component.$destroy();
    }
  };
}
