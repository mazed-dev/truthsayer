#!/usr/bin/env bash

set -e

# convert -background none -resize 75x75 src/img/new-upload-button.svg src/img/new-upload-button.png

for src in "$@"; do
  if [[ "$src" =~ svg$ ]]; then
    echo "Convert $src"
    dst=$(echo "$src" | sed -e 's/\.svg$/\.png/')
    convert -background none -resize 75x75 "$src" "$dst"
  fi
done
