#/usr/bin/env bash

set -x -e

# tar --create --bzip2 [--file ARCHIVE] [OPTIONS] [FILE...]
# tar {--diff|--compare} [--file ARCHIVE] [OPTIONS] [FILE...]
# tar --delete [--file ARCHIVE] [OPTIONS] [MEMBER...]
# tar --append [-f ARCHIVE] [OPTIONS] [FILE...]

## Env

_NAME="truthsayer"
_VERSION="$(date +'%Y.%m.%d-%H.%M.%S')"

_TARGET_DIR="./pkgs"

mkdir --parents $_TARGET_DIR

_REPO_PATH="./"

## Local var

_PKG_PATH="${_TARGET_DIR}/${_NAME}-${_VERSION}.tag.gz"

## Build

yarn build

## Pack

tar \
  --create \
  --gzip \
  --file "${_PKG_PATH}" \
  ${_REPO_PATH}/build \

