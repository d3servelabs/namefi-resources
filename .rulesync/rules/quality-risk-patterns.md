---
targets:
  - '*'
root: false
description: Apply when writing or reviewing Namefi Astra code; guardrails for correctness, reliability, security, workflow, dependency, and user-facing regressions.
globs:
  - '**/*'
cursor:
  alwaysApply: true
  description: Quality and risk guardrails for writing and reviewing Namefi Astra code.
  globs:
    - '**/*'
---

# Quality Risk Patterns

When writing or reviewing non-trivial code, apply the
`namefi-astra-quality-guardrails` skill. If generated skills are unavailable,
read `.rulesync/skills/namefi-astra-quality-guardrails/SKILL.md` and, for
non-trivial or high-risk changes,
`.rulesync/skills/namefi-astra-quality-guardrails/references/issue-buckets.md`.

Minimum checklist before handing off code:

- Do not enable actions, show success, or persist values before required state
  is loaded and current.
- Include every identity dimension in cache keys, storage keys, locks, database
  lookups, dedupe keys, and query invalidations.
- After `await`, re-check current request/component/account/signer/workflow
  state before committing side effects.
- Invalidate or refresh every reader that can show stale data after a mutation;
  stop polling on terminal states.
- Keep Temporal workflows deterministic and side effects in activities; preserve
  useful error cause/context across layers.
- Make user-facing copy and status labels match what is actually confirmed.
- For payments, user assets, domain ownership, auth, webhooks, secrets,
  migrations, CI/release automation, and dependencies, require stronger tests or
  runtime evidence.
- Prefer local fixes and existing patterns. Add abstraction only for proven
  duplication, consistency risk, or an established local API.
