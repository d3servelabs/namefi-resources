---
targets:
  - '*'
root: false
description: >-
  Trigger when working with logging levels or logger.* usage in backend code
globs: []
cursor:
  description: Trigger when working with logging levels or logger.* usage in backend code
  alwaysApply: false
---

# Logging Levels (Backend)

Use these levels with `apps/backend/src/lib/logger.ts` (pino) to keep alerts and dashboards meaningful.

## Level meanings
- fatal: Emergency, paging/alerting, cannot continue (service down, data corruption, security breach).
- error: Unexpected failure that should be fixed or investigated; request/workflow failed; rare exception.
- warn: Minor or expected error condition; degraded or recoverable behavior; noisy but not a bug.
- info: Useful state or business events that are not bugs.
- debug: Developer-only details (start/finish, decision branches, caught errors).
- trace: Measurements/metrics and detailed third-party response payloads.

## Guidance
- Only use `fatal` when an on-call should be alerted.
- Do not use `error` for expected user actions (e.g., invalid input, 401/403/404).
- Prefer `warn` for expected failures or soft-degraded states.
- Use `debug` for flow details and for errors that are caught and handled.
- Use `trace` for timing, metrics, and verbose external responses; not for exceptions.

## Quick examples
- 401/403/404 from user input: `trace`
- ratelimits are hit, retryable action has failed: `warn`
- External API returned 500 and request failed: `error`
- Service cannot start, corrupted state: `fatal`
- Function start/end, retries, caught exception details: `debug`
- API response payloads, timings, counters: `trace`
