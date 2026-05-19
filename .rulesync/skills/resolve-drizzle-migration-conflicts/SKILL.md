---
name: resolve-drizzle-migration-conflicts
description: Resolve git conflicts in Drizzle ORM migration files that arise when multiple PRs branch from the same migration index and each generates the same next numbered migration. Use when the user says "resolve drizzle migration conflict(s)", "resolve db (migration) conflict(s)", "fix migration conflict", or when conflicts appear in `packages/db/src/migrations/meta/_journal.json` or in a `packages/db/src/migrations/meta/NNNN_snapshot.json` file during a git rebase or merge.
---

# Resolve Drizzle Migration Conflicts

## Why this skill exists

Drizzle's `drizzle-kit generate` numbers migrations sequentially: `0001_`, `0002_`, ..., `0098_`, etc. When two PRs branch off the same commit and each generates its own next migration, both get the same index. Rebasing or merging them produces conflicts in:

- `packages/db/src/migrations/meta/_journal.json` — journal entry for the shared index (`UU`)
- `packages/db/src/migrations/meta/<idx>_snapshot.json` — snapshot file for the shared index (`AA`)
- `packages/db/src/migrations/<idx>_<name>.sql` — each side added a differently-named SQL file at the same index (`A` on the losing side after we take HEAD)

The resolution is mechanical: keep HEAD's view of the journal and snapshot, then delete any SQL file the resolved journal no longer references. The losing branch's schema changes are still in `schema.ts`, so the user can regenerate a migration with the next available index after the rebase/merge completes.

## Workflow

### 1. Confirm you are in the right state

Run the script only while a rebase or merge is in progress and there are conflicts under `packages/db/src/migrations/`. If unsure, run `git status`.

### 2. Dry-run first

```bash
python3 scripts/resolve_conflicts.py --dry-run
```

(Paths are relative to this skill's directory; run from the skill dir or substitute the absolute path.)

The dry-run lists every action without changing anything. It reads HEAD's copy of the journal to predict which SQL file(s) would be removed as orphans. Confirm the orphan list looks right before applying.

### 3. Apply

```bash
python3 scripts/resolve_conflicts.py
```

What the script does:

1. Runs `git checkout --ours -- <file>` then `git add -- <file>` for every conflicted file under the migrations dir. `--ours` always selects HEAD: during a rebase HEAD is the branch you are rebasing onto, during a merge HEAD is your current branch.
2. Reads the resolved `_journal.json` to collect the set of valid `tag` values.
3. Scans `<migrations-dir>/*.sql` and runs `git rm -f` on any file whose `<tag>.sql` is not in the journal.

### 4. Continue the operation

```bash
git status                  # sanity check
git rebase --continue       # or `git commit` if you were merging
```

### 5. Regenerate the migration if your branch had schema changes

If the commit being rebased/merged contained `schema.ts` changes whose migration was discarded, regenerate it so those changes are captured by a new migration with the next free index. A helper script wraps the command with a sane default `DATABASE_URL`:

```bash
scripts/regenerate_migration.sh
```

Override `DATABASE_URL` in the environment if your local Postgres differs from `postgres://postgres:postgres@localhost:5432/postgres`. Then:

```bash
git add packages/db/src/migrations
git commit -m "chore(db): regenerate migration after rebase"
```

## Flags

- `--migrations-dir <path>`: override the default `packages/db/src/migrations` if a project uses a different path.
- `--dry-run`: print every git command without executing.

## Manual fallback

If the script can't run for any reason, the equivalent manual steps are:

```bash
# 1. Identify the conflicting index from the snapshot conflict name
git status | grep '_snapshot.json'
#   e.g. packages/db/src/migrations/meta/0098_snapshot.json

# 2. Accept HEAD's version of journal + snapshot
git checkout --ours -- packages/db/src/migrations/meta/_journal.json
git checkout --ours -- packages/db/src/migrations/meta/0098_snapshot.json
git add packages/db/src/migrations/meta/_journal.json packages/db/src/migrations/meta/0098_snapshot.json

# 3. Find the correct tag for that idx in the resolved journal
#    e.g. "0098_mute_tigra"

# 4. Remove the orphan SQL file (the one that doesn't match the tag)
git rm -f packages/db/src/migrations/0098_redundant_jack_flag.sql

# 5. Continue the rebase/merge
git rebase --continue
```

## Caveats

- The script accepts HEAD's view of the journal. The SQL content from the losing branch's migration is discarded. The schema source-of-truth (`schema.ts`) is untouched, so regenerating the migration after the rebase/merge restores those changes as a new migration at the next free index.
- If both branches happened to generate the same `<tag>.sql` filename (very unlikely because Drizzle uses random adjective+noun suffixes), the SQL file itself would conflict (`UU`). The script handles that by taking HEAD for it as well.
- The script only touches files under the migrations dir. Other conflicts in the rebase/merge are left alone.
