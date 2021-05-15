#!/usr/bin/env bash

set -e

# | rg -i '\.svg$' | rg -v -i '-strip.svg'

for path in "$@"; do
  echo "$path";
done \
  | rg -i -e '\.svg$' | rg -v -i -e '-strip.svg' | while read path; do
  dst=$(echo "$path" | sed -e 's/\.svg$/-strip.svg/')
  echo "Strip file $path to $dst";

  scour \
    --strip-xml-prolog \
    --remove-titles \
    --remove-descriptions \
    --remove-metadata \
    --remove-descriptive-elements \
    --enable-comment-stripping \
    --disable-embed-rasters \
    --enable-viewboxing \
    --strip-xml-space \
    --enable-id-stripping \
    --shorten-ids \
    --error-on-flowtext \
    -i "$path" \
    -o "$dst"
done
