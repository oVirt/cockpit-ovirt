#!/bin/bash -xe

shopt -s nullglob

dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
dnf clean metadata || yum clean metadata
dnf -y install ${dependencies} || yum -y install ${dependencies}

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
yum-builddep cockpit-ovirt.spec
make rpm
cp *.tar.gz tmp.repos/

for file in $(find tmp.repos/ -iregex ".*\.\(tar\.gz\|rpm\)$"); do
    echo "Archiving $file"
    mv "$file" exported-artifacts/
done
