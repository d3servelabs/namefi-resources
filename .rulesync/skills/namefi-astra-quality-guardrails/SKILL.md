---
name: namefi-astra-quality-guardrails
description: Use when implementing or reviewing Namefi Astra code changes to avoid quality and risk patterns around readiness state, async races, identity/keying, cache invalidation, Temporal, user-facing truthfulness, CI automation, dependencies, and high-risk payments/assets/auth/domain flows.
---

# Namefi Astra Quality Guardrails

Use this skill before writing code, while self-reviewing a diff, and when doing
human or bot review. It is for correctness, reliability, security, and workflow
risk. It is not a style checklist.

For non-trivial changes, and always for high-risk areas, read
[issue-buckets.md](references/issue-buckets.md) and apply the relevant buckets
to the touched workflow.

## Working Mode

1. Trace the user-visible or system-visible workflow that the change affects.
2. Identify the relevant issue buckets before choosing an implementation.
3. Keep the fix local unless duplication or coupling is already proven.
4. Add or update tests where the risk is behavior, state, persistence, or API
   contract. For UI, also verify the visible state. For workflows and scripts,
   prefer a command or run link.
5. Self-review the final diff against the buckets before handing it off.

## Always Check

- Readiness and loading gates: UI or jobs must not enable actions, display
  success, or persist defaults before required state is loaded.
- State, defaults, and persistence: storage keys, fallback values, schema
  migrations, and reset paths must match the current account, chain, locale,
  environment, and feature.
- Identity and composite keys: cache keys, database keys, lookup keys, locks,
  and dedupe keys must include every dimension that makes a value unique.
- Async sequencing: after every `await`, re-check whether the component,
  request, job, signer, or workflow state is still current before committing
  side effects.
- Cache invalidation and polling: mutations must refresh every reader that can
  show stale data, and polling must stop on terminal states.
- Temporal and background work: workflow code must stay deterministic;
  activities must be idempotent enough for retries; errors must preserve the
  layer that operators and users need.
- User-facing truthfulness: labels, success messages, disabled states, and docs
  must not overstate what the system has completed or verified.
- CI, release, and preview automation: events, permissions, branch filters,
  tokens, artifacts, and false-green paths must match the intended trust model.
- Dependencies and bundle surface: new packages must be used, locked, not
  suspiciously fresh for the touched risk, and not dragged into hot client or
  app-shell paths unnecessarily.

## High-Risk Areas

Treat these as requiring stronger tests or runtime evidence:

- Payments, Stripe, x402, refunds, order totals, transaction submission, signer
  locks, nonce handling, NFT/NFSC ownership, registration, renewal, transfer,
  authentication, authorization, user identity, webhooks, and secrets.
- Database schema or migration changes.
- Temporal workflows, activities, task queues, and retry behavior.
- DNS/DNSSEC, nameserver, domain ownership, parked-domain verification, and
  registry/registrar logic.
- GitHub Actions, releases, deployment, preview, and merge automation.

## Noise Boundaries

Do not block on nits, speculative architecture concerns, or general preferences.
Prefer a small, concrete fix in the touched code over a new abstraction. Add a
shared abstraction only when it removes proven duplication, prevents a real
consistency bug, or follows an existing local pattern.
