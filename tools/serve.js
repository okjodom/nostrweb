import { createServer, request } from 'http'
import esbuild from 'esbuild';

import config from '../esbuildconf.js';

// from https://github.com/evanw/esbuild/issues/802
const clients = [];
config.options.banner = {
  js: ' (() => new EventSource("/_live").onmessage = () => location.reload())();'
};
config.options.watch = {
  onRebuild(err, res) {
    if (err) {
      console.log(err);
      return;
    }
    clients.forEach((c) => c.write('data: update\n\n'));
    const n = clients.length;
    clients.length = 0;
    console.log(`>>> sent reload msg to ${n} client(s)`);
  }
};
esbuild.build(config.options).catch(() => process.exit(1));

const s = {
  host: '127.0.0.1',
  servedir: config.options.outdir,
  onRequest: (req) => {
    console.log(`${req.method} ${req.path} ${req.status} ${req.timeInMS}ms`);
  }
};
esbuild.serve(s, {}).then(server => {
  const {host, port} = server;
  const livePort = port + 1;
  console.log(`serving content from http://${host}:${port}/`);
  console.log(`serving live reload at http://${host}:${livePort}/`);
  createServer((req, resp) => {
    const { url, method, headers } = req;
    if (url === '/_live') {
      clients.push(resp.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        'connection': 'keep-alive',
      }));
      console.log(`>>> client connected; total is now ${clients.length}`);
      return;
    }
    const path = ~url.split('/').pop().indexOf('.') ? url : '/index.html';
    const proxyReq = request({hostname: host, port: port, path, method, headers}, (proxyResp) => {
      resp.writeHead(proxyResp.statusCode, proxyResp.headers);
      proxyResp.pipe(resp, {end: true});
    });
    req.pipe(proxyReq, {end: true});
  }).listen(livePort, host);
});
