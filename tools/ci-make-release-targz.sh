#!/bin/sh
set -e

# assuming the script is run from the repo root dir
cd dist

# create build metadata
truncate -s0 build.txt
echo "remote: $CI_REPO_REMOTE" >> build.txt
echo "commit: $CI_COMMIT_SHA" >> build.txt
echo "tag: $CI_COMMIT_TAG" >> build.txt
echo "build id: $CI_BUILD_NUMBER" >> build.txt
cat build.txt

# make the release archive in the repo root dir
tar -czvf ../nostrweb.tar.gz *
