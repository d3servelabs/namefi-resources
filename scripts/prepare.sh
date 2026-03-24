#!/usr/bin/env sh
set -e

if [ -z "${CI:-}" ] \
  && command -v git >/dev/null 2>&1 \
  && git rev-parse --git-dir >/dev/null 2>&1 \
  && [ -x "./node_modules/.bin/lefthook" ]; then
  bun run lefthook install
  bun run rulesync:generate
fi
