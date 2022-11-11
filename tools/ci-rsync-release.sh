#!/bin/sh
set -e
printenv RELEASER_SSH_KEY > .sshkey
chmod 0600 .sshkey
sshcmd='ssh -i .sshkey -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'
exec rsync -vrz -e "$sshcmd" dist/* nostrreleaser@nostr.ch:/var/www/nostr/
