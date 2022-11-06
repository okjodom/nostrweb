import { createRequire } from 'module';

import alias from 'esbuild-plugin-alias';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// see docs at https://esbuild.github.io/api/
export const options = {
  entryPoints: [
    'src/main.js',
    'src/main.css',
    'src/index.html',
    'src/bubble.svg'
  ],
  outdir: 'dist',
  //entryNames: '[name]-[hash]', TODO: replace urls in index.html with hashed paths
  loader: {'.html': 'copy', '.svg': 'copy'},
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
    NodeGlobalsPolyfillPlugin({buffer: true})
  ]
};

export default {options: options}
