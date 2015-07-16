#!/bin/sh

rm -fr dist
r.js -o build.js

echo -n 'cleaning up dist...'
# cleanup dist
cd dist

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
