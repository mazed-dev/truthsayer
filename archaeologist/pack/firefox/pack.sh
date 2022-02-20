#!/usr/bin/env bash

set -e

_CURRENT_DIR="$(pwd)"
_UNCOMMITTED_CHANGES="$(git status --porcelain=v1 2>/dev/null)"

if [[ $_UNCOMMITTED_CHANGES ]]; then
  echo "There are local uncommitted changes. Please commit and merge any changes into public main branch before publishing a new version of firefox extension to Mozilla Web Store." >&2
  echo "" >&2
  echo "$_UNCOMMITTED_CHANGES" >&2
  exit 1
fi

for i in $(seq 1 5); do
  echo "Looking for the repo root $i: $(pwd)" >&2
  if [[ -f "archaeologist/public/manifest.json" ]]; then
    echo "Repo root found $(pwd)" >&2
    break
  fi
  cd ..
done

if [[ ! -f "archaeologist/public/manifest.json" ]]; then
  echo "Can not find root of the repo" >&2
  exit 1
fi

cd archaeologist

yarn build:firefox:public

_REV="$(git rev-parse HEAD)"

mkdir -p target/packed

cd target/unpacked

_OUT="../packed/firefox-mazed-$_REV.zip"

zip -r -FS $_OUT ./*

echo "Packed firefox extension: $PWD/$_OUT" >&2

cd "$_CURRENT_DIR"
