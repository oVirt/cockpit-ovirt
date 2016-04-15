#!/bin/bash -xe

./autogen.sh --with-vdsm && make -j8 check
