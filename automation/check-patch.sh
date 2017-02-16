#!/bin/bash -xe

# Force CI to get the latest version of these packages:
dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
yum-deprecated clean metadata || yum clean metadata
yum-deprecated -y install ${dependencies} || yum -y install ${dependencies}

export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}
./autogen.sh --with-vdsm --with-npm-install && make -j8 check
