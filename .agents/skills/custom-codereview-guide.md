---
name: namefi-astra-codereview-guide
description: Repository-specific review priorities for Namefi Astra pull requests.
triggers:
  - /codereview
---

# Namefi Astra PR Review Guide

Use this guide as project context on top of OpenHands' default `/codereview`
and `/github-pr-review` skills. Do not replace the OpenHands review flow,
inline-comment format, or GitHub API behavior. If this guide conflicts with the
checked-out code, current PR diff, or upstream OpenHands instructions, trust the
code and upstream instructions.

Review only the pull request diff and directly related context. Be direct,
specific, and high-signal. Avoid broad architectural commentary unless it points
to a concrete correctness, security, reliability, or maintainability problem in
the current change.

This repository uses RuleSync as the source of truth for reusable agent
guidance. Apply the implementation-time guidance in
`.rulesync/skills/namefi-astra-quality-guardrails/SKILL.md`. For non-trivial
changes, and always for high-risk areas, also read
`.rulesync/skills/namefi-astra-quality-guardrails/references/issue-buckets.md`.
Use those buckets to catch quality and risk issues before commenting:

- Readiness/loading gates and premature success states.
- State defaults, persistence, reset, and migration behavior.
- Identity dimensions in composite keys, locks, caches, and dedupe logic.
- Async races after `await`, stale closures, double submits, and stale signers.
- Cache invalidation, polling, and stale visible state.
- Temporal determinism, activity idempotency, task queues, and error layers.
- User-facing truthfulness in status, copy, and docs.
- Security, permissions, migrations, CI/release automation, dependencies, and
  bundle surface.

## Re-Review Hygiene

This repository moves quickly and PRs are often rebased or force-pushed.

- Treat the provided previous review history as state, not as evidence that a
  current issue still exists.
- Do not repost an equivalent inline comment when there is already an
  unresolved thread for the same issue on the current code.
- Ignore resolved or outdated bot threads unless the same bug is still present
  in the current diff. If it is still present, post a fresh comment with current
  line evidence.
- If a previous thread has human replies, be conservative. Do not assume it can
  be closed or superseded unless the current code makes that obvious.
- If a bot-only unresolved thread is clearly fixed by the latest code, or the
  latest code documents an accepted repository policy decision, resolve that
  review thread through GitHub instead of repeating it in the next review body.
- On repeated pushes, prefer fewer new comments. Add a new finding only when it
  applies to the latest diff and has a clear current line target.

## Review Scope

- Trace the affected workflow before commenting; do not reason from the changed
  line alone when a caller, cache key, workflow, or UI state determines behavior.
- Prefer concrete line comments over summary-only concerns when the issue is
  Critical or Important.
- Do not post walkthroughs, praise, style-only comments, speculative rewrites, or
  generic "add tests" comments without naming the missing behavior.
- If the issue is a missing invariant, name the invariant and the path that
  violates it.

## Severity

Use the OpenHands priority labels consistently:

- Critical: exploitable security, privacy, data-loss, payment, transaction,
  user-asset risk, failing build/tests caused by the PR, or likely production
  regression. Request changes.
- Important: likely functional bug, reliability regression, broken API
  contract, missing error handling in a meaningful path, migration risk, or
  severe performance issue. Add an inline comment with a concrete fix. Request
  changes only when the PR has `ai-review:strict` or the issue is effectively
  Critical for the touched area.
- Suggestion: local readability, small maintainability improvements, non-risky
  performance cleanup, or documentation polish. Put these in the review summary
  only when useful.
- Nit: do not post. Linters and formatters own this.

Approve the PR when no Critical issue remains. If requesting changes, keep the
blocking list short and make each blocker independently actionable.

## Inline Comments

- Post one GitHub review per run and batch inline comments into that review.
- Add inline comments only for Critical and Important issues.
- Normally add at most 3 new inline comments. Use 4-5 only when each finding is
  independently high-confidence and materially affects the PR.
- Do not add "looks good" inline comments.
- Use GitHub suggestions only for small, contiguous edits after verifying the
  targeted line range in the checked-out file.
- Include evidence from the changed line, nearby source, a called API contract,
  or a repo command. If you cannot prove the issue from available context,
  downgrade it or omit it.

## High-Risk Areas

Treat these areas as higher risk and require stronger reasoning, tests, or
runtime evidence:

- Payments, Stripe, x402, refunds, order totals, transaction submission, signer
  locks, nonce handling, NFT/NFSC ownership, registration, renewal, transfer,
  authentication, authorization, or user identity changes.
- Database schema and migration changes. Verify schema and migration changes
  are in the same PR and that migration direction matches runtime code.
- Temporal workflows and activities. Look for replay-safety issues, task queue
  mistakes, non-deterministic workflow code, and missing evidence from a real or
  local Temporal run when behavior changes.
- DNS/DNSSEC, nameserver, domain ownership, parked-domain verification, and
  registry/registrar logic.
- GitHub Actions, release, deployment, preview, and merge automation. Check
  permission scope, event type, branch exclusions, fork behavior, and token use.

## Evidence

For backend/API/script changes, prefer a command and output from running the
real changed path. For frontend/UI changes, prefer screenshots or a short
video. For agent-generated changes, a conversation link is useful but not
enough if the change touches a high-risk area.

Missing evidence is blocking only when the PR changes a high-risk area or the
change cannot be assessed safely from tests and code review alone.

## Threat Model

Consider exposure. Do not treat trusted internal-only paths as public attack
surfaces unless the PR makes them reachable from untrusted users or third-party
systems. Fail closed on code that handles secrets, wallets, payments, domain
ownership, authentication, authorization, or webhook payloads.

For `.github/workflows/openhands-pr-review.yml`, the Codex ACP setup currently
uses OpenAI API-key auth in the ACP process environment and OpenHands sets
Codex ACP to full-access mode. Maintainers have explicitly accepted this risk
for this same-repo-only review workflow. Do not request changes solely for that
documented ACP process-environment risk. Still block changes that expand this
workflow to fork PRs, `pull_request_target`, broader app-token permissions,
unscoped secret exposure, or automatic review beyond the documented rollout.

## Dependencies

For dependency changes, verify the new dependency or version is actually used,
the lockfile is updated, and the package/version is not suspiciously fresh for
the risk of the touched area. Do not approve a critical dependency update solely
because install succeeds.
