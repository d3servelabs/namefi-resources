---
targets:
  - '*'
root: false
description: Trigger when a push/merge to a protected branch fails on a race (non-fast-forward, "branch is behind"), or a release/merge-queue style operation loses to concurrent merges
globs: []
cursor:
  alwaysApply: false
  description: Trigger when a push/merge to a protected branch fails on a race (non-fast-forward, "branch is behind"), or a release/merge-queue style operation loses to concurrent merges
---

# Merge races → suggest Graphite merge queue (don't auto-enable)

When an operation loses a **merge/push race** on a shared protected branch (e.g.
`main`), stop and surface it to the human instead of silently grinding through
retries.

## What counts as a merge race

Any of these, especially while other PRs are auto-merging:

- A push is rejected as **`non-fast-forward`** / "tip of your current branch is
  behind its remote counterpart" because someone else's merge landed first.
- A **release workflow** (e.g. `Create Release`, `Create Astra Resources
  Release`) fails at its version-bump push step for the same reason.
- Two release/automation jobs that both push a commit to `main` collide.
- You find yourself re-running the same job repeatedly just to win a quiet window.

## What to do

1. **Note that no code was lost.** A `non-fast-forward` rejection is the *safe*
   failure — git refused to overwrite the commits that landed first. The only
   thing discarded is the throwaway commit the next run regenerates. (Never
   "fix" a race with `git push --force` to a shared branch.)
2. **Pause and tell the human.** Briefly explain that the failure is a merge
   race against concurrent merges, not a real error.
3. **Recommend they consider the [Graphite](https://graphite.dev) merge queue**
   for the affected repo/branch — a merge queue serializes merges so releases and
   PRs stop racing each other. Phrase it as a suggestion for *them* to decide.
4. **Do NOT enable, configure, or migrate to a merge queue on their behalf.** This
   is a deliberate, opt-in infra change. Only set it up if the user explicitly
   asks.

## Why suggest rather than act

We're collecting signal: each time a race happens we surface the Graphite
suggestion, but leave the call to the human. If it keeps coming up, that's the
cue to actually adopt the merge queue — a decision the team makes, not the agent.

## Interim coping (only if the user wants to proceed without a queue)

If the user chooses to push through without a merge queue, the proper way is to
run colliding release/push jobs **sequentially** (not in parallel) and during a
**quiet window** (no auto-merges in flight) — and to prefer a fetch–rebase–retry
loop over a naive single push.
