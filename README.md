# nostr web client

this is a web interface to [nostr](https://github.com/nostr-protocol/nostr#readme).
a live instance is hosted at https://nostr.ch/

some useful resources:

* JS library used in this project: https://github.com/fiatjaf/nostr-tools
* NIPs: https://github.com/nostr-protocol/nips
* relays registry: https://nostr-registry.netlify.app
* event inspector: https://nostr.guru
* a list of nostr projects and resources: https://nostr.net

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

## release

1. make sure `version` field in [package.json](package.json) as seen by remote
git on **master** branch matches the tag created in the next step.
2. tag a commit on **master** branch with a `git tag v<vesion>`.
3. push the tag to the remote: `git push --tags`.

the CI then receives a git tag event, executes `npm run build`, creates
a tar.gz with all the files found in `dist` directory and uploads it as a new
release artifact. the release is named after the tag name.

the idea is that nostr web instances are then notified about a new release,
download the tar.gz archive and update their local copies.
this is not yet implemented. at the moment, the CI symply rsync's dist/ with
a remote on https://nostr.ch.
