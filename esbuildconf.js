import { createRequire } from 'module';

import alias from 'esbuild-plugin-alias';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

import { replaceOnCopyPlugin } from './tools/esbuild-helper.js'

// see docs at https://esbuild.github.io/api/
export const options = {
  entryPoints: [
    'src/about.html',
    'src/assets/comment.svg',
    'src/assets/heart-fill.svg',
    'src/assets/nostr-favicon.png',
    'src/assets/nostr-favicon.svg',
    'src/assets/star.svg',
    'src/assets/star-fill.svg',
    'src/favicon.ico',
    'src/index.html',
    'src/main.css',
    'src/main.js',
    'src/manifest.json',
  ],
  outdir: 'dist',
  //entryNames: '[name]-[hash]', TODO: replace urls in index.html with hashed paths
  loader: {'.html': 'copy', '.ico': 'copy', '.png': 'copy', '.svg': 'copy'},
  bundle: true,
  platform: 'browser',
  minify: false, // TODO: true for release and enable sourcemap
  define: {
    window: 'self',
    global: 'self'
  },
  // https://github.com/esbuild/community-plugins
  plugins: [
    alias({
      // cipher-base require's "stream"
      stream: createRequire(import.meta.url).resolve('readable-stream')
    }),
    NodeGlobalsPolyfillPlugin({buffer: true}),
    replaceOnCopyPlugin(/about\.html$/),
    replaceOnCopyPlugin(/manifest\.json$/),
  ]
};

export default {options: options}
