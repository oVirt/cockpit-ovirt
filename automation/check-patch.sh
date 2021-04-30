#!/bin/bash -xe

# Test rpm building, avoiding to discover it doesn't build only after merge.
# Doing this before make check because yarn install may add missing deps at
# rpm level
./automation/build-artifacts.sh

# TODO: Only run this if the build failed - if this works then nodejs-modules will
# TODO: probably need a pre-seed or rebuild
export PATH=/usr/share/ovirt-engine-nodejs-modules/bin:${PATH}
yarn config delete yarn-offline-proxy

./autogen.sh --with-yarn-install && make -j8 check

