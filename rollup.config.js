const svelte = require('rollup-plugin-svelte');
const css = require('rollup-plugin-css-only');
const terser = require('@rollup/plugin-terser');
const resolve = require('@rollup/plugin-node-resolve');
const path = require('path');
const fs = require('fs');

const production = !process.env.ROLLUP_WATCH;

module.exports = {
  input: 'src/renderer/main.js',
  output: {
    sourcemap: !production,
    format: 'iife',
    name: 'app',
    file: 'src/renderer/dist/bundle.js'
  },
  plugins: [
    svelte({
      compilerOptions: {
        // Enable run-time checks when not in production
        dev: !production
      }
    }),
    // Extract CSS into a separate file
    css({ output: 'bundle.css' }),

    // Resolve node modules
    resolve({
      browser: true,
      dedupe: ['svelte'],
      exportConditions: ['svelte']
    }),

    // If we're building for production, minify
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};
