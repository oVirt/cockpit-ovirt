#!/bin/bash -xe

shopt -s nullglob

# cleanup
rm -Rf \
    exported-artifacts \
    tmp.repos
mkdir exported-artifacts

# generate automake/autoconf files
./autogen.sh

# create rpm
make rpm

for file in $(find tmp.repos/ -iregex ".*\.\(tar\.gz\|rpm\)$"); do
    echo "Archiving $file"
    mv "$file" exported-artifacts/
done
