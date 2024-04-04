import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
const prod = process.env.NODE_ENV === 'production';

const files = import.meta.glob(['./**/*.svelte', './**/*.js'], { as: 'raw' });

async function loadFile(dirname: string, filename: string) {
  const source = await files[`./${dirname}/${filename}`]();
  const [name, type] = filename.split('.');

  return {
    name,
    type,
    source,
  };
}

function load(title: string, dirname: string, filenames: string[]) {
  return async () => {
    const components = await Promise.all(
      filenames.map((filename) => loadFile(dirname, filename))
    );

    return {
      title,
      components,
    };
  };
}

interface ReplPreset {
  title: string;
  components: Array<{
    name: string;
    type: string;
    source: string;
  }>;
}

const objects: Record<string, () => Promise<ReplPreset>> = {
  '8b7315b62b874c3f8079d2b1d4bedc07': load(
    'Svelte Query Mutations',
    'svelte_query_mutations',
    ['App.svelte', 'mutations.js']
  ),
  '7df044e9afe947c6bc62cee60f426f73': load(
    'Imperative API Translator',
    'imperative_api_translator',
    ['App.svelte']
  ),
  '36a84bbe2cf74c899ada6380e6e632d8': load(
    'Leaflet in Svelte with Renderless Components',
    'leaflet',
    [
      'App.svelte',
      'Control.svelte',
      'Leaflet.svelte',
      'MapToolbar.svelte',
      'Marker.svelte',
      'Polyline.svelte',
      'Popup.svelte',
    ]
  ),
  ab9cdbdd9a6a420288938d51fd17e22a: load(
    'One-way Binding',
    'svelte_two_way_binding',
    ['one_way_binding.svelte']
  ),
  '0507d12784304b978239a71063f38cde': load(
    'Two-way binding',
    'svelte_two_way_binding',
    ['two_way_binding.svelte']
  ),
  '92058b31e5424fc09b476795bb6cc59a': load(
    'Zoom-independent Leaflet Shapes',
    'leaflet_shapes',
    ['App.svelte', 'MapToolbar.svelte', 'shapes.js']
  ),
  '62271e8fda854e828f26d75625286bc3': load(
    'Leaflet in Svelte',
    'leaflet_in_svelte',
    ['App.svelte', 'MapToolbar.svelte', 'MarkerPopup.svelte', 'markers.js']
  ),
  '9708a375b4564f0a89105c743610fc10': load(
    'Deferred Transitions Example',
    'deferred_transitions',
    ['App.svelte']
  ),
  '844a720d073f4ae296843cb6e531b111': load(
    'Simple CSS Variables',
    'svelte_dynamic_css',
    ['simple_variables.svelte']
  ),
  '14c51f9ed5204b56bcdbe4c1fc110e2b': load(
    'CSS Variables Do Not Alter Classes Applied in Parent Elements',
    'svelte_dynamic_css',
    ['parent_classes.svelte']
  ),
  '8123d474edb04f198c3b83363716a709': load(
    'Dynamic CSS Variables',
    'svelte_dynamic_css',
    ['dynamic_variables.svelte']
  ),
  '25f0c3653b89434888292a1f92717e2a': load(
    'Dynamic CSS Variables on Document, Set from Different Components',
    'svelte_dynamic_css',
    [
      'dynamic_across_components.svelte',
      'ColorSetting.svelte',
      'styleManager.js',
    ]
  ),
  '92647d0aa8d94aae84e70e374405233d': load(
    'CSS Grid for Overlapping Element Transitions',
    'overlapping_transitions',
    ['App.svelte']
  ),
  '32bf500c4b8b4b718daee1fae74b6a51': load(
    'Svelte Zoomable Grid Example',
    'svelte_zoomable',
    ['App.svelte', 'ZoomGrid.svelte', 'ZoomGridItems.svelte']
  ),
};

export const GET: RequestHandler = async function GET({ params }) {
  let headers: Record<string, string> = {};
  let obj = objects[params.id];
  if (!obj) {
    error(404, 'Not found');
  }

  let data = await obj();
  data.id = params.id;

  data.components[0].name = 'App';

  if (prod) {
    headers['Cache-Control'] = 'max-age=300, s-maxage=2592000';
  }

  return json(data, { headers });
};
