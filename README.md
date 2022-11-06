# nostr web sandbox

a playground for a web interface to [nostr](https://nostr.info/).
some useful resources:

* JS library used in this project: https://github.com/fiatjaf/nostr-tools
* NIPs: https://github.com/nostr-protocol/nips
* relays registry: https://nostr-registry.netlify.app/
* event inspector: https://nostr.com/
* a working web interface in vue.js: https://astral.ninja/
* https://github.com/aljazceru/awesome-nostr

## dev

nodejs v18.x and npm v8.x are recommended.

after `npm install`, start by running a dev server with:

    npm run serve

and point a browser to http://127.0.0.1:8001/

the `serve` command injects a live reload snippet. to build a "production" copy,
execute

    npm run build

the build is done using [esbuild](https://esbuild.github.io/), with a config in
[esbuildconf.js](esbuildconf.js). the result is placed in `dist` directory.
