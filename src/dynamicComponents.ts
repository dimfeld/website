import { SvelteComponent } from 'svelte';
import DynamicComponentWrapper from './DynamicComponentWrapper.svelte';

const components = {
  ReadingSince: () => import('./interactive/ReadingSince.svelte'),
  Slider: () => import('./interactive/Slider.svelte'),
  Roller: () => import('./interactive/Roller.svelte'),
  Repl: () => import('./interactive/ReplWrapper.svelte'),
  PostReplSvelteContext: () =>
    import('./interactive/PostReplSvelteContext.svelte'),
  PostReplAddingStateMachineActions: () =>
    import('./interactive/PostReplAddingStateMachineActions.svelte'),
  PostReplSingleElementEach: () =>
    import('./interactive/PostReplSingleElementEach.svelte'),
};

async function instantiateComponent(element: Element) {
  let attrs = element.getAttributeNames();

  let component: typeof SvelteComponent | null = null;
  let props: { [key: string]: string } = {};
  for (let attr of attrs) {
    let value = element.getAttribute(attr);
    if (!value) {
      continue;
    }

    if (attr === 'data-component') {
      let componentImporter = components[value];
      if (componentImporter) {
        component = (await componentImporter()).default;
      }
    } else if (attr.startsWith('data-prop-')) {
      let propName = attr.slice('data-prop-'.length);
      props[propName] = value;
    }
  }

  if (!component) {
    return;
  }

  let instance = new DynamicComponentWrapper({
    target: element,
    props: {
      component,
      componentProps: props,
    },
  });

  element.classList.add('has-component');

  return instance;
}

export default async function instantiateComponents() {
  let divs = Array.from(document.querySelectorAll('[data-component]'));
  let components = (await Promise.all(divs.map(instantiateComponent))).filter(
    Boolean
  ) as SvelteComponent[];

  return () => {
    for (let component of components) {
      try {
        component.$destroy();
      } catch (e) {
        console.error(e);
      }
    }
  };
}
