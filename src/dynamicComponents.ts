import { SvelteComponent, tick } from 'svelte';
import DynamicComponentWrapper from './DynamicComponentWrapper.svelte';
import camelCase from 'just-camel-case';

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
  SwrXstateExample: () => import('./interactive/SwrXstate.svelte'),
  BadTransitionJump: () => import('./interactive/BadTransitionJump.svelte'),
};

async function instantiateComponent(element: Element) {
  try {
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
          console.log('awaiting import', componentImporter);
          await tick();
          component = (await componentImporter()).default;
          console.log('await done');
        } else {
          console.error(`Unknown dynamic component ${value}`);
        }
      } else if (attr.startsWith('data-prop-')) {
        let propName = attr.slice('data-prop-'.length);

        props[camelCase(propName)] = value;
      }
    }

    if (!component) {
      return;
    }

    console.log('instantiating', element);

    let instance = new DynamicComponentWrapper({
      target: element,
      props: {
        component,
        componentProps: props,
      },
    });

    element.classList.add('has-component');

    return instance;
  } catch (e) {
    console.error(e);
  }
}

export default async function instantiateComponents() {
  let divs = Array.from(document.querySelectorAll('[data-component]'));
  let components: SvelteComponent[] = [];

  for (let div of divs) {
    let component = await instantiateComponent(div);
    if (component) {
      components.push(component);
    }
  }

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
