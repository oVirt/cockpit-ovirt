#!/bin/bash -xe

# Test rpm building, avoiding to discover it doesn't build only after merge.
# Doing this before make check because npm install may add missing deps at
# rpm level
./automation/build-artifacts.sh

export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}
./autogen.sh --with-npm-install && make -j8 check

