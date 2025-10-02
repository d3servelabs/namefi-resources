#!/usr/bin/env sh
set -eu
mkdir -p ./static
wget -O - https://github.com/knadh/listmonk/archive/master.tar.gz | tar xz -C ./static --strip=2 "listmonk-master/static"