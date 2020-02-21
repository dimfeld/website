import * as path from 'path';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';
const svelteConfig = require('./svelte.config');

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, onwarn) => {
  // Transformed async function cause a lot of these errors.
  if (warning.code === 'THIS_IS_UNDEFINED') {
    return;
  }

  return (
    (warning.code === 'CIRCULAR_DEPENDENCY' &&
      /[/\\]@sapper[/\\]/.test(warning.message)) ||
    onwarn(warning)
  );
};
const dedupe = (importee) =>
  importee === 'svelte' || importee.startsWith('svelte/');

const babelServerConfig = {
  extensions: ['.js', '.mjs', '.html', '.svelte', '.ts'],
  exclude: ['node_modules/@babel/**'],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 12 },
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-optional-chaining',
  ],
};

const babelClientConfig = {
  ...babelServerConfig,
  runtimeHelpers: !dev,
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { chrome: 78 }, // dev ? { chrome: 78 } : '> 0.25%, not dead',
      },
    ],
    '@babel/preset-typescript',
  ],
  plugins: [
    ...babelServerConfig.plugins,
    legacy && [
      '@babel/plugin-transform-runtime',
      {
        useESModules: true,
      },
    ],
  ].filter(Boolean),
};

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        extensions: ['.svelte', '.svx'],
        dev,
        hydratable: true,
        emitCss: true,
        preprocess: svelteConfig.preprocess,
      }),
      json(),

      babel(babelClientConfig),

      resolve({
        browser: true,
        extensions: ['.mjs', '.js', '.json', '.ts'],
        dedupe,
      }),
      commonjs(),

      !dev &&
        terser({
          module: true,
        }),
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        extensions: ['.svelte', '.svx'],
        generate: 'ssr',
        dev,
        preprocess: svelteConfig.preprocess,
      }),
      json(),
      babel(babelServerConfig),

      resolve({
        dedupe,
        extensions: ['.mjs', '.js', '.json', '.ts'],
      }),

      commonjs(),
      postcss({
        extract: path.resolve(__dirname, './static/global.css'),
        plugins: require('./postcss.config').plugins,
      }),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require('module').builtinModules ||
        Object.keys(process.binding('natives'))
    ),

    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      !dev && babel(babelClientConfig),
      commonjs(),
      !dev && terser(),
    ],

    onwarn,
  },
};
