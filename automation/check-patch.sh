#!/bin/bash -xe

# Force CI to get the latest version of these packages:
dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
yum-deprecated clean metadata || yum clean metadata
yum-deprecated -y install ${dependencies} || yum -y install ${dependencies}

export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}

# Test rpm building, avoiding to discover it doesn't build only after merge.
# Doing this before make check because npm install may add missing deps at
# rpm level
./autogen.sh
yum-builddep cockpit-ovirt.spec
make rpm

./autogen.sh --with-npm-install && make -j8 check


