---
targets:
  - '*'
root: false
description: Require README coverage and ancestor README review when changing files in Namefi Astra.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Require README coverage and ancestor README review when changing files in Namefi Astra.
  globs:
    - '**/*'
---
# README Documentation Rule

This is a Namefi Astra repo-local rule. Do not depend on OPC or external
workspace docs for this practice.

## Required Practice

- Before modifying a file, read the containing folder's `README.md` when it
  exists, plus the file's intro/frontmatter when present.
- Any folder with more than 5 direct files must have a `README.md` that briefly
  states what the folder is for, how the files relate to each other, and includes
  an ASCII structure diagram when that helps future readers.
- When a file changes, consider whether to update the `README.md` in that file's
  folder and every ancestor folder up to the repo root. Keep README updates
  brief; prefer links to deeper docs over long duplicated explanations.
- If a touched folder over the 5-file threshold lacks a useful `README.md`, add
  or update one as part of the same change. Do not churn untouched historical
  gaps unless they are needed to explain the work.
- If tooling forbids a folder-level `README.md`, document the exception in the
  nearest usable ancestor README and encode the exemption in
  `scripts/check-readmes.ts` with a rationale.

## Precheck

- Run `bun run check:readmes` before pushing documentation-sensitive changes.
- `validate`, `validate:staged`, `validate:pre-push`, and the pre-commit hook run
  the README precheck too.
