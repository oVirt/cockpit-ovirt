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

# mock environment is screwed up, resetting to a sane environment
rm -f /etc/yum.conf
dnf reinstall -y system-release dnf
dnf -y reinstall dnf-conf
sed -i -re 's#^(reposdir *= *).*$#\1/etc/yum.repos.d#' '/etc/dnf/dnf.conf'
echo "deltarpm=False" >> /etc/dnf/dnf.conf
dnf install -y https://resources.ovirt.org/pub/yum-repo/ovirt-release-master.rpm
rm -f /etc/yum/yum.conf
dnf repolist enabled
dnf clean all


dependencies="$(sed -e '/^[ \t]*$/d' -e '/^#/d' automation/packages.force)"
dnf clean metadata

if [[ "$(rpm --eval "%dist")" == ".el8" ]]; then
    dnf module reset nodejs
    dnf module enable nodejs:10
    dnf module info nodejs:10
    dnf --allowerasing distro-sync -y
    # nodejs:10 module seems broken as of April 17th 2020.
    dnf install -y \
	http://mirror.centos.org/centos/8/AppStream/x86_64/os/Packages/npm-6.13.4-1.10.19.0.2.module_el8.1.0+296+bef51246.x86_64.rpm \
    	http://mirror.centos.org/centos/8/AppStream/x86_64/os/Packages/nodejs-10.19.0-2.module_el8.1.0+296+bef51246.x86_64.rpm
fi

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
