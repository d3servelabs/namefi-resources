---
targets:
  - '*'
root: false
description: Trigger when the agent creates or edits a pull request description
globs: []
cursor:
  alwaysApply: false
  description: Trigger when the agent creates or edits a pull request description
---
# Pull Request Description Standards

Every PR description must contain the following sections, in this order.

## 1. Summary / Solution (required)

- State **what the PR does** and, for a bug fix, **how it is fixed** — not just
  the issue and root cause. A reviewer should understand the chosen solution
  without reading the diff.
- For fixes, include: **Issue → Root cause → Solution (how)** → key changes.
- Reference the issue it closes (e.g. `Fixes #1234`).

## 2. Test plan (required)

- List how the change was validated (unit tests, type-check, lint, manual
  steps). Call out anything automation can't cover (e.g. live wallet flows) so
  the reviewer knows what to verify manually.

## 3. Claude session summary (required when the PR was authored with Claude)

When a PR is created (in whole or part) by a Claude Code session, append a
section summarizing that session:

- **Main prompts (high level):** a bulleted, paraphrased summary of the user's
  driving prompts — **not verbatim**, just the intent of each main step.
- **Redaction:** never include keys, secrets, tokens, credentials, customer PII,
  raw email contents, or other sensitive data. Summarize around them (e.g.
  "traced a customer-reported swap bug" rather than quoting the email).
- **Timestamps:** include the time the session started and the time it last
  updated the PR, in ISO 8601 UTC (`yyyy-MM-dd'T'HH:mm:ss'Z'`). Use a verifiable
  anchor for the start (e.g. the first artifact the session created) and the
  latest commit's timestamp for the last update.

The purpose is provenance and reviewability — a reader should be able to see, at
a glance, how the change came to be and what human intent drove it.
