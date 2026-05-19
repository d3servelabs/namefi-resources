#!/usr/bin/env python3
"""Resolve Drizzle migration index conflicts during a git rebase or merge.

Drizzle generates numeric-index based migration files (0001, 0002, ...). When
parallel PRs branch from the same migration, each generates the SAME next
index, producing conflicts in:

    <migrations-dir>/meta/_journal.json          (UU)
    <migrations-dir>/meta/<idx>_snapshot.json    (AA)
    <migrations-dir>/<idx>_<some-name>.sql       (extra A on the losing side)

The resolution this script implements:

  1. Accept HEAD's version of every conflicted file under the migrations dir.
     During a rebase, HEAD is the branch you are rebasing onto (the "upstream"
     side). During a merge, HEAD is your current branch. In both cases
     `git checkout --ours <file>` selects HEAD's version.
  2. Read the resolved journal and remove any SQL file in the migrations dir
     whose tag is not referenced by the journal. Those are the orphans
     introduced by the side we did not accept.

After running this, the user's schema.ts changes are still in the working tree
(if they were part of the in-flight commit), so re-generating the migration
via `drizzle-kit generate` (e.g. `bun --cwd packages/db run db:generate`) will
produce a fresh migration with the next available index.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


DEFAULT_MIGRATIONS_DIR = "packages/db/src/migrations"
SQL_FILE_RE = re.compile(r"^\d{4}_.*\.sql$")


def run(cmd: list[str], cwd: Path | None = None, check: bool = True) -> str:
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if check and res.returncode != 0:
        sys.stderr.write(f"$ {' '.join(cmd)}\n{res.stderr}")
        sys.exit(res.returncode)
    return res.stdout.strip()


def try_run(cmd: list[str], cwd: Path | None = None) -> str | None:
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        return None
    return res.stdout


def repo_root() -> Path:
    return Path(run(["git", "rev-parse", "--show-toplevel"]))


def git_dir() -> Path:
    return Path(run(["git", "rev-parse", "--git-dir"]))


def detect_op(d: Path) -> str | None:
    if (d / "rebase-merge").exists() or (d / "rebase-apply").exists():
        return "rebase"
    if (d / "MERGE_HEAD").exists():
        return "merge"
    return None


def conflicted_files(root: Path) -> list[str]:
    out = run(["git", "diff", "--name-only", "--diff-filter=U"], cwd=root)
    return [line for line in out.splitlines() if line]


def is_under(path: str, root: str) -> bool:
    root = root.rstrip("/")
    return path == root or path.startswith(root + "/")


def take_head(root: Path, files: list[str], dry_run: bool) -> None:
    for f in files:
        if dry_run:
            print(f"  [dry-run] git checkout --ours -- {f}")
            print(f"  [dry-run] git add -- {f}")
            continue
        run(["git", "checkout", "--ours", "--", f], cwd=root)
        run(["git", "add", "--", f], cwd=root)
        print(f"  resolved: {f}")


def read_journal_tags(journal_path: Path) -> set[str] | None:
    try:
        data = json.loads(journal_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        sys.stderr.write(f"failed to parse {journal_path}: {exc}\n")
        return None
    return {entry["tag"] for entry in data.get("entries", []) if "tag" in entry}


def read_journal_tags_from_head(root: Path, journal_file: str) -> set[str] | None:
    text = try_run(["git", "show", f"HEAD:{journal_file}"], cwd=root)
    if text is None:
        return None
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    return {entry["tag"] for entry in data.get("entries", []) if "tag" in entry}


def find_orphan_sql(migrations_path: Path, valid_tags: set[str]) -> list[Path]:
    orphans: list[Path] = []
    for p in sorted(migrations_path.iterdir()):
        if not p.is_file() or not SQL_FILE_RE.match(p.name):
            continue
        if p.name[:-4] not in valid_tags:
            orphans.append(p)
    return orphans


def is_tracked(root: Path, rel_path: str) -> bool:
    return (
        try_run(["git", "ls-files", "--error-unmatch", "--", rel_path], cwd=root)
        is not None
    )


def remove_orphan(root: Path, rel_path: str, dry_run: bool) -> None:
    if dry_run:
        if is_tracked(root, rel_path):
            print(f"  [dry-run] git rm -f -- {rel_path}")
        else:
            print(f"  [dry-run] skip untracked orphan candidate: {rel_path}")
        return
    if not is_tracked(root, rel_path):
        # `git rm -f` aborts on untracked paths and would leave the workflow
        # half-done. Leave the file in place for the user to handle manually.
        print(f"  skipped untracked orphan candidate: {rel_path}")
        return
    run(["git", "rm", "-f", "--", rel_path], cwd=root)
    print(f"  removed orphan: {rel_path}")


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--migrations-dir",
        default=DEFAULT_MIGRATIONS_DIR,
        help=f"Path to the Drizzle migrations directory, relative to the repo root (default: {DEFAULT_MIGRATIONS_DIR})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print every action without changing the index or working tree.",
    )
    args = parser.parse_args()

    root = repo_root()
    op = detect_op(git_dir())
    if op is None:
        print("Not currently in a rebase or merge — nothing to do.")
        return 0

    migrations_dir = args.migrations_dir.rstrip("/")
    meta_dir = f"{migrations_dir}/meta"
    journal_file = f"{meta_dir}/_journal.json"

    if not (root / migrations_dir).is_dir():
        sys.stderr.write(
            f"migrations dir not found: {migrations_dir}\n"
            f"pass --migrations-dir if your project uses a different path.\n"
        )
        return 1

    conflicts = conflicted_files(root)
    targets = [f for f in conflicts if is_under(f, migrations_dir)]

    print(f"operation: {op}")
    print(f"migrations dir: {migrations_dir}")

    if not targets:
        print(f"no conflicted files under {migrations_dir} — nothing to resolve.")
        return 0

    print(f"\naccepting HEAD for {len(targets)} conflicted file(s):")
    take_head(root, targets, args.dry_run)

    if args.dry_run:
        valid_tags = read_journal_tags_from_head(root, journal_file)
    else:
        valid_tags = read_journal_tags(root / journal_file)

    if valid_tags is None:
        sys.stderr.write("WARN: could not read resolved journal; skipping orphan cleanup.\n")
    else:
        print(
            f"\nresolved journal references {len(valid_tags)} migration tag(s); "
            "scanning for orphans..."
        )
        orphans = find_orphan_sql(root / migrations_dir, valid_tags)
        if not orphans:
            print("  none found.")
        else:
            for p in orphans:
                remove_orphan(root, f"{migrations_dir}/{p.name}", args.dry_run)

    regen_script = (Path(__file__).resolve().parent / "regenerate_migration.sh")
    try:
        regen_display = str(regen_script.relative_to(root))
    except ValueError:
        regen_display = str(regen_script)

    print("\nnext steps:")
    print("  1. review:    git status")
    if op == "rebase":
        print("  2. continue:  git rebase --continue")
    else:
        print("  2. commit:    git commit")
    print(
        "  3. if your branch contained schema changes whose migration was discarded,\n"
        "     regenerate it (after step 2) with the next available index, then commit:\n"
        f"       {regen_display}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
