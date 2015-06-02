#!/bin/sh

rm -fr dist
r.js -o build.js

echo -n 'cleaning up dist...'
# cleanup dist
cd dist
# remove extraneous
rm -fr .git .gitignore \
   bower.json .bowerrc \
   build.js build.sh build.txt

rm -fr app/templates

cd app/vendor
mkdir -p ../keep/bootstrap/dist/
mv bootstrap/dist/css bootstrap/dist/fonts ../keep/bootstrap/dist/
mkdir -p ../keep/requirejs
mv requirejs/require.js ../keep/requirejs
mkdir -p ../keep/octicons
mv octicons/octicons ../keep/octicons

rm -fr *
mv ../keep/* .
rm -fr ../keep

echo done
