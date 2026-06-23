# Quality and Risk Issue Buckets

Use this as a prevention and review checklist. Pick the buckets that match the
touched workflow; do not apply every item mechanically.

## Readiness and Loading Gates

Look for actions, submits, links, success states, scheduled jobs, and writes that
can run before prerequisites are loaded. Common failures include enabling a
button before auth/account/chain/pricing/domain state is known, persisting a
fallback as if it were real data, or showing success after only the first step of
a multi-step flow.

Prevent it by modeling pending, unavailable, failed, and ready states separately.
Disable irreversible actions until all required state is ready. Make optimistic
UI reversible or clearly pending.

## State, Defaults, and Persistence

Look for defaults that are valid only for one account, chain, locale,
environment, feature flag, or schema version. Common failures include reusing
local storage across identities, treating a missing value as user intent, and
forgetting reset or migration behavior.

Prevent it by versioning persisted state, including identity dimensions in
storage keys, and using explicit "unknown" states instead of fallback values
where correctness matters.

## Identity, Composite Keys, Locks, and Deduping

Look for keys that collapse distinct entities. Common missing dimensions are
user, tenant, domain/name, chain, network, token, locale, environment, role,
time window, task queue, and feature namespace.

Prevent it by writing key builders in one place when the same key is shared.
Tests should show that two similar-but-distinct entities do not collide.

## Async Sequencing and Race Conditions

Look for code that commits side effects after an `await` without checking
whether the request, component, signer, route, account, or workflow state is
still current. Common failures include double-submit races, stale closures,
set-state-after-unmount, stale signer/nonce use, and last-response-loses bugs.

Prevent it with request IDs, abort signals, current-state checks, idempotency
keys, and disabled/in-flight guards. Make retries safe.

## Cache Invalidation, Polling, and Stale Views

Look for mutations that update only one reader while other screens, summaries,
counts, badges, or server/client caches keep stale data. Polling should stop on
terminal states and should not hide permanent failures as "still loading."

Prevent it by enumerating all readers before changing a mutation, invalidating
query keys at the same identity granularity used to fetch, and testing the
visible state after success and failure.

## Temporal, Background Jobs, and Error Layers

Look for non-deterministic workflow code, wrong task queues, activity code
called from workflow context, retry-unsafe side effects, swallowed errors, and
errors translated into messages that lose the operational layer.

Prevent it by keeping workflows deterministic, moving side effects into
activities, preserving cause/context in errors, and validating changed workflows
with a local run or Temporal link when behavior changes.

## User-Facing Truthfulness

Look for copy or UI state that claims more than the system knows: "verified,"
"registered," "paid," "synced," "live," "sent," or "complete" before the
backend, chain, registry, DNS, or third party has confirmed it.

Prevent it with precise status labels, pending states, recovery guidance, and
separate messages for queued, submitted, confirmed, failed, and partially
complete states.

## Security, Permissions, and Trust Boundaries

Look for changes that make internal-only paths reachable by untrusted users,
weaken auth checks, broaden token permissions, expose secrets in logs or
processes, trust webhook payloads without verification, or mix admin and user
authorization models.

Prevent it by locating the boundary first, failing closed for secrets/wallets/
payments/domain ownership/auth, and testing unauthorized and cross-identity
access paths.

## Database, Migration, and Data Contract Drift

Look for schema/runtime mismatch, missing migrations, irreversible data changes,
unsafe backfills, nullable assumptions, enum drift, and API clients whose types
no longer match server behavior.

Prevent it by keeping schema and migration changes together, documenting
backfill/default behavior, and testing old-data plus new-data paths.

## CI, Release, Preview, and Merge Automation

Look for workflows that run on the wrong event, include fork PRs by accident,
over-scope permissions, use secrets in untrusted contexts, skip required
branches, produce false-green checks, or race on release/version commits.

Prevent it by checking event type, branch filters, permission blocks, token
source, artifact trust, concurrency, and failure handling.

## Dependencies, Bundles, and Generated Code

Look for dependencies that are added speculatively, lockfile drift, packages
published very recently for high-risk paths, server-only modules pulled into
client bundles, broad barrel exports, and hand-edited generated files.

Prevent it by verifying actual usage, pinning through the existing package
manager, checking bundle-sensitive import paths, and changing source inputs
rather than generated outputs unless the generated file is intentionally
committed for a runtime like OpenHands.
