#!/usr/bin/env bash

set -x -e

# convert -background none -resize 75x75 src/img/new-upload-button.svg src/img/new-upload-button.png
convert -background none -resize 75x75 $1 $2
