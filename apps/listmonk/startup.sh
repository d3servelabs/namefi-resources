#!/bin/sh
STATIC_DIR="${LISTMONK_app__static_dir:-}"
./listmonk --install --idempotent --yes --config ''
./listmonk --upgrade --yes --config ''
echo "STATIC_DIR: $STATIC_DIR"
if [ -n "$STATIC_DIR" ]; then
  ./listmonk --config '' --static-dir "$STATIC_DIR"
else
  ./listmonk --config ''
fi