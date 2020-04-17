#!/bin/bash -xe

shopt -s nullglob
# Is this a release - build from tag?
# tags are like:     cockpit-ovirt-0.11.17-1
# non tags are like: cockpit-ovirt-0.11.17-1-3-gf36b431
if git describe --tags --match "cockpit-ovirt*"|cut -f4- -d\-| grep -q '-'; then
    # This is a master build, we want to make every build
    # newer than all the previous builds using a timestamp,
    # and make it easy to locate the commit from the build
    # with the git commit hash.
    export PACKAGE_RPM_RELEASE=0
    export RELEASE_SUFFIX=".$(date --utc +%Y%m%d%H%M%S).git$(git rev-parse --short HEAD)"
fi

dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
dnf clean metadata 
dnf -y install ${dependencies}

# cleanup
rm -Rf \
    exported-artifacts \
    tmp.repos

echo '{ "allow_root": true }' > ~/.bowerrc
mkdir exported-artifacts

# generate automake/autoconf files
export PATH=/usr/share/ovirt-engine-nodejs/bin:${PATH}
./autogen.sh

# create rpm
dnf builddep cockpit-ovirt.spec
make rpm
cp *.tar.gz tmp.repos/

for file in $(find tmp.repos/ -iregex ".*\.\(tar\.gz\|rpm\)$"); do
    echo "Archiving $file"
    mv "$file" exported-artifacts/
done
