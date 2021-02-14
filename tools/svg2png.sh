#!/usr/bin/env bash

set -e

# convert -background none -resize 75x75 src/img/new-upload-button.svg src/img/new-upload-button.png

for src in "$@"; do
  if [[ "$src" =~ -small\.svg$ ]]; then
    echo "Convert small $src"
    dst=$(echo "$src" | sed -e 's/\.svg$/\.png/')
    convert -background none -resize 16x16 "$src" "$dst"
  elif [[ "$src" =~ svg$ ]]; then
    echo "Convert normal $src"
    dst=$(echo "$src" | sed -e 's/\.svg$/\.png/')
    convert -antialias -background none -resize 72x72 "$src" "$dst"
  fi
done

