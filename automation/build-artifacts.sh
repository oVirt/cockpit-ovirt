#!/bin/bash -xe

if [[ "${1:-foo}" != "copr" ]] ; then
# Force updating nodejs-modules so any pre-seed update to rpm wait is minimized
PACKAGER=$(command -v dnf >/dev/null 2>&1 && echo 'dnf' || echo 'yum')
REPOS=$(sed -e '/^#/d' -e '/^[ \t]*$/d' automation/build.repos | cut -f 1 -d ',' | paste -s -d,)

${PACKAGER} --disablerepo='*' --enablerepo="${REPOS}" clean metadata
${PACKAGER} -y install ovirt-engine-nodejs-modules
fi

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

# Clean and then create the artifacts directory:
rm -rf exported-artifacts
mkdir -p exported-artifacts
rm -rf tmp.repos
rm -f ./*tar.gz

# Prep the build
export PATH="/usr/share/ovirt-engine-nodejs-modules/bin:${PATH}"
./autogen.sh

# Create rpm
if [[ "${1:-foo}" != "copr" ]] ; then
make rpm
else
make srpm
fi

# Store any relevant artifacts in exported-artifacts for the ci system to archive
[[ -d exported-artifacts ]] || mkdir -p exported-artifacts
for file in $(find tmp.repos/ -iregex ".*\.\(tar\.gz\|rpm\)$"); do
    echo "Archiving $file"
    mv "$file" exported-artifacts/
done
