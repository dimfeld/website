import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

const mode = process.env.NODE_ENV;
const dev = mode === 'development';

export default ['compiler', 'bundler'].map((x) => {
  return {
    input: `node_modules/@sveltejs/svelte-repl/src/workers/${x}/index.js`,
    output: {
      file: `static/workers/${x}.js`,
      format: 'iife',
    },
    plugins: [resolve(), json(), !dev && terser()],
  };
});
