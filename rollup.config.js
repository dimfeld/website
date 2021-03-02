import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { string } from 'rollup-plugin-string';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';
import * as path from 'path';
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import * as glob from 'glob';
import * as colors from 'kleur';
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
    (warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
    (warning.code === 'CIRCULAR_DEPENDENCY' &&
      /(?:[/\\]@sapper|node_modules)[/\\]/.test(warning.message)) ||
    onwarn(warning)
  );
};

function globalTailwindCssBuilder({
  input = 'src/global.pcss',
  output = 'static/global.css',
  postcssConfigPath = `${process.cwd()}/postcss.config.js`,
  sourcemap = false,
  dev = false,
}) {
  let builder;
  let rebuildNeeded = false;

  const globalCSSWatchFiles = [
    postcssConfigPath,
    'tailwind.config.js',
    input,
  ].map((p) => path.resolve(p));

  const buildGlobalCSS = () => {
    if (builder) {
      rebuildNeeded = true;
      return;
    }
    rebuildNeeded = false;
    const start = performance.now();

    try {
      builder = spawn('node', [
        '--unhandled-rejections=strict',
        path.join(__dirname, 'build-global-css.mjs'),
        sourcemap,
        postcssConfigPath,
        input,
        output,
      ]);
      builder.stdout.pipe(process.stdout);
      builder.stderr.pipe(process.stderr);

      builder.on('close', (code) => {
        if (code === 0) {
          const elapsed = parseInt(performance.now() - start, 10);
          console.log(
            `${colors.bold().green('✔ global css')} (${input} → ${output}${
              sourcemap === true ? ` + ${output}.map` : ''
            }) ${colors.gray(`(${elapsed}ms)`)}`
          );
        } else if (code !== null) {
          if (dev) {
            console.error(`global css builder exited with code ${code}`);
            console.log(colors.bold().red('✗ global css'));
          } else {
            throw new Error(`global css builder exited with code ${code}`);
          }
        }

        builder = undefined;

        if (rebuildNeeded) {
          console.log(
            `\n${colors
              .bold()
              .italic()
              .cyan('something')} changed. rebuilding...`
          );
          buildGlobalCSS();
        }
      });
    } catch (err) {
      console.log(colors.bold().red('✗ global css'));
      console.error(err);
    }
  };

  let first = true;
  return {
    name: 'build-global-css',
    buildStart() {
      if (first) {
        first = false;
        buildGlobalCSS();
      }
      globalCSSWatchFiles.forEach((file) => this.addWatchFile(file));
    },
    watchChange(id) {
      if (globalCSSWatchFiles.includes(id)) {
        buildGlobalCSS();
      }
    },
  };
}

const babelServerConfig = {
  babelHelpers: 'bundled',
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
  presets: [
    [
      '@babel/preset-env',
      {
        targets: dev ? { chrome: 83 } : { esmodules: true },
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
    let files = [
      ...glob.sync(__dirname + '/posts/**/*.md'),
      ...glob.sync(__dirname + '/notes/**/*.md'),
      ...glob.sync(__dirname + '/roam-pages/**/*.html'),
    ];

    for (let file of files) {
      this.addWatchFile(file);
    }

    this.addWatchFile(__dirname + '/src/template.html');
  },
};

let domain = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : `http://${require('os').hostname()}:${
      process.env.DEV_PORT || process.env.PORT || 3000
    }`;

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    preserveEntrySignatures: false,
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.SITE_DOMAIN': domain,
      }),
      svelte({
        compilerOptions: {
          dev,
          hydratable: true,
        },
        preprocess: svelteConfig.preprocess,
      }),
      json(),
      string({
        // Required to be specified
        include: '**/*.txt',
      }),
      // html({ include: '**/*.html' }),

      resolve({
        browser: true,
        extensions: ['.mjs', '.js', '.ts', '.json'],
        dedupe: ['svelte'],
      }),
      commonjs(),

      babel(babelClientConfig),

      !dev &&
        terser({
          module: true,
        }),

      globalTailwindCssBuilder({ sourcemap: true, dev }),
    ],

    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    preserveEntrySignatures: 'strict',
    plugins: [
      watchPlugin,
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.SITE_DOMAIN': domain,
      }),
      svelte({
        compilerOptions: {
          generate: 'ssr',
          dev,
        },
        preprocess: svelteConfig.preprocess,
      }),
      json(),
      string({
        // Required to be specified
        include: '**/*.txt',
      }),
      // html({ include: '**/*.html' }),

      resolve({
        dedupe: ['svelte'],
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
    preserveEntrySignatures: false,
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
