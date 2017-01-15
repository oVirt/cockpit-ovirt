#!/bin/bash -xe

npm install eslint babel-eslint webpack copy-webpack-plugin clean-webpack-plugin
export PATH=$PWD/node_modules/.bin:$PATH

shopt -s nullglob

# cleanup
rm -Rf \
    exported-artifacts \
    tmp.repos

echo '{ "allow_root": true }' > ~/.bowerrc
mkdir exported-artifacts

# generate automake/autoconf files
./autogen.sh

# create rpm
make rpm

for file in $(find tmp.repos/ -iregex ".*\.\(tar\.gz\|rpm\)$"); do
    echo "Archiving $file"
    mv "$file" exported-artifacts/
done
