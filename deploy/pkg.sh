#/usr/bin/env bash

set -e

# tar --create --bzip2 [--file ARCHIVE] [OPTIONS] [FILE...]
# tar {--diff|--compare} [--file ARCHIVE] [OPTIONS] [FILE...]
# tar --delete [--file ARCHIVE] [OPTIONS] [MEMBER...]
# tar --append [-f ARCHIVE] [OPTIONS] [FILE...]

## Env
echo "Set up environment"

_NAME="truthsayer"
_VERSION="$(date +'%Y.%m.%d-%H.%M.%S')"

_TARGET_DIR="./deploy/pkgs"

mkdir --parents $_TARGET_DIR

_REPO_PATH="./"

## Local var

_PKG_FILE="${_NAME}-${_VERSION}.tag.gz"
_PKG_PATH="${_TARGET_DIR}/${_PKG_FILE}"

## Build
echo "Build"

yarn build

## Pack

echo "Pack"
tar \
  --create \
  --gzip \
  --file "${_PKG_PATH}" \
  ${_REPO_PATH}/build \

## Ready

echo "To finish the deploy run:"
echo "1. % scp -P 5326 ${_PKG_PATH} \[2a03:b0c0:1:e0::443:5001\]:"
echo "2. % ssh 2a03:b0c0:1:e0::443:5001 -p 5326 -A"
echo "3. % tar --extract --gzip --file=./${_PKG_FILE}"
