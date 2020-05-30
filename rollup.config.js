import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from 'rollup-plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';
import * as glob from 'glob';
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
      /(?:[/\\]@sapper|node_modules)[/\\]/.test(warning.message)) ||
    onwarn(warning)
  );
};
const dedupe = (importee) =>
  importee === 'svelte' || importee.startsWith('svelte/');

const babelServerConfig = {
  extensions: ['.js', '.mjs', '.html', '.svelte', '.ts'],
  exclude: ['node_modules/@babel/**', '_GlobalCss.svelte'],
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
        targets: dev ? { chrome: 78 } : { esmodules: true },
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

const watchPlugin = {
  name: 'watch-content',
  buildStart(id) {
    let files = glob.sync(__dirname + '/posts/**/*.md');
    for (let file of files) {
      this.addWatchFile(file);
    }

    files = glob.sync(__dirname + '/notes/**/*.md');
    for (let file of files) {
      this.addWatchFile(file);
    }

    this.addWatchFile(__dirname + '/src/template.html');
  },
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
        dev,
        hydratable: true,
        emitCss: true,
        preprocess: svelteConfig.preprocess,
      }),
      json(),
      // html({ include: '**/*.html' }),

      resolve({
        browser: true,
        extensions: ['.mjs', '.js', '.ts', '.json'],
        dedupe,
      }),
      commonjs(),

      babel(babelClientConfig),

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
      watchPlugin,
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
      }),
      svelte({
        generate: 'ssr',
        dev,
        preprocess: svelteConfig.preprocess,
      }),
      json(),
      // html({ include: '**/*.html' }),

      resolve({
        dedupe,
        extensions: ['.mjs', '.js', '.ts', '.json'],
      }),

      commonjs(),
      babel(babelServerConfig),
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
