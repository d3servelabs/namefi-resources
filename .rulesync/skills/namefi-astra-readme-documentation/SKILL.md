---
name: namefi-astra-readme-documentation
description: Use when modifying Namefi Astra files or directories, adding or removing files, creating or editing README.md files, writing PR descriptions, or fixing failures from bun run check:readmes. Enforces the repo-local README documentation rule, ancestor README review, and the README precheck.
---

# Namefi Astra README Documentation

Use this skill as the repo-local source of truth for README coverage. Do not
depend on OPC workspace docs for this practice.

## Workflow

1. Before editing a file, read the containing folder's `README.md` when it
   exists, plus the file's intro/frontmatter when present.
2. For each changed file, consider its folder and every ancestor folder up to
   repo root. Update READMEs when the change affects folder purpose, file
   relationships, commands, workflows, architecture, ownership, or validation.
3. If a touched folder has more than 5 direct files and no useful `README.md`,
   add or update one in the same change unless the folder is generated/vendor
   output or explaining the historical gap would be clearer in a follow-up.
4. Keep READMEs brief. State purpose, explain how files relate, and include a
   small ASCII structure diagram when it clarifies navigation. Link deeper docs
   instead of duplicating long explanations.
5. In PR descriptions, include Documentation impact: say whether touched folder
   READMEs and ancestor READMEs were updated, reviewed and left unchanged, or not
   applicable.
6. Run `bun run check:readmes` before handoff. This is also included in
   `validate`, `validate:staged`, `validate:pre-push`, and pre-commit.

## Precheck Behavior

`scripts/check-readmes.ts` checks changed files and their ancestors. It fails
when a checked folder has more than 5 direct files and no `README.md`, while
ignoring generated agent output folders such as `.agents`, `.claude`,
`.cursor`, and `.opencode`.

Some tooling source folders cannot contain their own `README.md`. For example,
RuleSync treats every Markdown file in `.rulesync/rules` as a rule, so that
folder is explicitly exempted and documented in `.rulesync/README.md` instead.
