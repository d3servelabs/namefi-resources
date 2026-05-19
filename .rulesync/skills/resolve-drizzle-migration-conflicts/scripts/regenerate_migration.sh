#!/usr/bin/env bash
#
# Regenerate the Drizzle migration after a conflict resolution.
#
# Run AFTER `git rebase --continue` (or after committing the merge): this
# captures whatever schema.ts diff is left over into a fresh migration with
# the next free index. drizzle-kit needs a reachable database URL to compare
# against, but it does not actually run the migration — it only reads the
# schema and writes new SQL + meta files.
#
# Override DATABASE_URL in the environment if your local Postgres differs.
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

: "${DATABASE_URL:=postgres://postgres:postgres@localhost:5432/postgres}"
export DATABASE_URL

# Do not echo $DATABASE_URL — a user-provided override can carry real
# credentials.
echo "DATABASE_URL is set"
echo "$ bun --cwd=packages/db db:generate"
bun --cwd=packages/db db:generate

echo
echo "next: review the new migration under packages/db/src/migrations/,"
echo "then: git add packages/db/src/migrations && git commit"
