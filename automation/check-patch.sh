#!/bin/bash -xe

export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}
./autogen.sh --with-vdsm --with-npm-install && make -j8 check
