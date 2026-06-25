---
targets:
  - '*'
root: false
description: Trigger when agent is asked to use Git (e.g. `git commit`)
globs: []
cursor:
  alwaysApply: false
  description: Trigger when agent is asked to use Git (e.g. `git commit`)
---
# git related

## Never bypass git hooks

- **Do NOT use `--no-verify`** on `git commit` or `git push`, and **do NOT set
  `LEFTHOOK=0`** (or otherwise skip lefthook). The pre-commit/pre-push hooks run
  fast (pre-commit ~0.3s auto-formats staged files; pre-push runs
  typecheck-affected + biome + sherif + i18n + cuj, all offline). Letting them
  run is what keeps biome/format/lint failures from bouncing back from CI.
- **The hooks run headless** (lefthook ≥ 2.x — it no longer needs a TTY), so a
  non-interactive / agent / CI shell is **not** a reason to skip them. If you see
  lefthook fail with `device not configured` (a TTY error), your lefthook is too
  old — run `bun install` to pick up the pinned 2.x, don't bypass.
- **If a hook fails, fix the underlying issue — never bypass it.** A red hook is
  signal, not an obstacle.
- **If a hook is slow, hangs, or fails for a reason unrelated to your change**
  (e.g. a pre-existing typecheck error in a package you did not touch, or a
  missing/stale `node_modules`): run `bun install` to sync deps first; if it
  still misbehaves, stop and report it so the hook gets fixed — do not reach for
  `--no-verify` as a workaround.
- A fresh worktree has no `node_modules` until you run `bun install`; without it
  the hook cannot find lefthook and silently does nothing. Always `bun install`
  in a new worktree before committing.

## Cloud Agent PR behavior (when committing)

- If running **as a Cursor Cloud Agent** and you are committing work, you must ensure there is an open PR for the current branch:
  - If there is **no PR yet** for the current branch, create one (via `gh pr create`) after pushing.
  - If there is **already a PR** for the current branch, push commits to update it (and do not create a new PR).

### If `gh` PR creation is rejected (GraphQL / integration permissions)

- If `gh pr create` fails with a permission error (e.g. `Resource not accessible by integration`), fall back to **GitHub REST API** instead of GraphQL.

- Preferred REST approach (uses existing `gh` auth, but REST endpoints):
  - Discover repo: `gh repo view --json nameWithOwner --jq .nameWithOwner`
  - Create PR: `gh api -X POST repos/{owner}/{repo}/pulls -f title="..." -f head="{branch}" -f base="{base}" -f body="..."`
  - Find existing PR for branch: `gh api repos/{owner}/{repo}/pulls -f state=open -f head="{owner}:{branch}"`

- If `gh api` is also blocked, use raw REST with a token (`GITHUB_TOKEN` / `GH_TOKEN`) via `curl`:
  - Create PR: `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/{owner}/{repo}/pulls -d '{"title":"...","head":"{branch}","base":"{base}","body":"..."}'`

## Summarize code change

- Run `git --no-pager diff --staged` and go through the *current* code change and summarize the updates into <git_commit_message> and suggest a short <new_branch_name>

- You need to make a judgement: if this is a small file change, the <git_commit_message> should only be one single line; If it's more than 100 lines of code change (excluding documentation and comments), or non-trivial code change, <git_commit_messsage> should be one line conventional commit style plus a multi line bullet points

- Run `git --no-pager log -n 100 --pretty=format:"%h %s"` to the recent commit history to understand the conventional commit message style and scopes being used for <git_commit_message>

## ClickUp & GitHub Integration Rules

**Precondition:** Apply these rules ONLY if a ClickUp Task ID (e.g., `1abc2de`) or a custom ID matching the pattern `NFI-<number>` is provided in the context.

- **Task ID Format:** Use the hashtag prefix: `#{ID}` (e.g., #NFI-1234).
- **Commit Messages:** Adhere strictly to Conventional Commits. Place the Task ID in the **footer** (after a blank line) to maintain a valid header.
  - *Example:*
    ```
    feat(ui): add localstorage
    
    #NFI-1234
    ```
- **PR Titles:** Append the Task ID to the end of the PR title.
  - *Example:* `feat(ui): add localstorage #NFI-1234`
- **PR Descriptions:** Ensure the Task ID is included in the description to guarantee the sync between GitHub and ClickUp.
- **Status Updates:** To trigger an automatic status change in ClickUp via GitHub, use the format `#{ID}[Status Name]` (no spaces) in the commit footer or PR description.
  - *Example:* `#NFI-1234[In Review]`

## Respond

Based on the current staged git changes, please summarize them as a branch name and a `git commit` message. Please format message as plaintext with proper handle of newline to be copy and used in terminal. Output in markdown for easy copy-and-paste.

## PR Labels
- If the PR needs a fully functional preview deployment for testing, add the label `preview`.
  - `preview` will allow the preview deployment to be created automatically. But it will still validate if it's needed in the first place.
  - If you want to force a preview deployment, add the label `force-preview`.
    - `force-preview` will force the preview deployment to be created, regardless of whether it's needed or not.
