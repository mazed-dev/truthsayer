#!/usr/bin/env bash

_UNCOMMITTED_CHANGES="$(git status --porcelain=v1 2>/dev/null)"

#if [[ $_UNCOMMITTED_CHANGES ]]; then
#  echo "There is local uncommitted change. Please commit and merge any changes into public main branch before publishing a new version of chrome extension to Chrome Web Store." >&2
#  echo "" >&2
#  echo "$_UNCOMMITTED_CHANGES" >&2
#  exit 1
#fi

for i in $(seq 1 5); do
  echo "Looking for the repo root $i: $(pwd)"
  if [[ -f "archaeologist/public/manifest.json" ]]; then
    echo "Repo root found $(pwd)"
    break
  fi
  cd ..
done

if [[ ! -f "archaeologist/public/manifest.json" ]]; then
  echo "Can not find root of the repo" >&2
  exit 1
fi

cd archaeologist

yarn build:chrome:public

_REV="$(git rev-parse HEAD)"

mkdir -p target/packed/

zip -r target/packed/chrome-mazed-$_REV.zip target/unpacked
