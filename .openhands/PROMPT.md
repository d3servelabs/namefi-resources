Verify GITHUB_TOKEN is set in the environment. Then for PR ${REVIEW_BOT_GITHUB_PR_NUMBER} perform the following:

1) Analyze only the latest code changes and identify substantive issues (bugs, security, performance, API misuse, regressions). Prefer high-signal over volume.

2) Severity policy:
- Critical: exploitable security/data-loss/privacy risk, legal/compliance, or failing build/tests. Request changes (blocking).
- Major: likely functional bug/regression or severe reliability issue. Comment with suggested fix. Do NOT request changes (non-blocking).
- Minor: style/nits, small perf micro-optimizations, naming, regex specificity, docs. Summarize only in the summary comment; avoid line comments (non-blocking).

3) Threat modeling guidance:
- Consider exposure. Do not treat internal-only code or trusted-input paths as external attack surface unless explicitly exposed.
- Regex specificity is Minor unless used as a security boundary on untrusted input.
- Performance suggestions are Minor unless obvious severe complexity (e.g., quadratic on large inputs).
- Naming is never a security risk; suggest improvements as Minor.

4) Summary and comments:
- Post exactly ONE summary starting with <!-- openhands-review --> and heading OpenHands Review Summary. If present, UPDATE the existing summary in place.
- Add line-level comments only for Critical and Major. Limit to at most 3 new line comments per run.

5) Dedupe, respect maintainers, and resolve addressed threads:
- Before posting, read existing bot comments AND human replies. If maintainers replied with phrases like: Fixed in, Don't Care, Not possible, or otherwise addressed, treat as resolved and do NOT repost.
- When re-reviewing, resolve previously created bot review threads that have valid maintainer responses or are superseded by new commits. Prefer GitHub GraphQL resolveReviewThread. If resolving is not available, reply "Resolved by maintainer/context" and do not add further comments on that thread.
- Respect labels: if PR has ai-review:chill or non-blocking, never request changes unless Critical. If ai-review:strict, you may request changes for Major.

6) Approvals: Approve the PR unless any Critical issues remain.

7) Idempotency: Re-runs must not duplicate comments. Update the existing summary and only add new line comments if they do not already exist (normalize/truncate bodies to detect duplicates).

8) Repo policy overlay (.coderabbit.yaml):
- If a .coderabbit.yaml file exists at the repository root, READ and APPLY its rules. Treat it as the authoritative policy overlay.
- Honor settings for severity thresholds, blocking/approval behavior, path/file include-exclude filters, comment style/limits, and rule suppressions.
- When this prompt conflicts with .coderabbit.yaml, .coderabbit.yaml TAKES PRECEDENCE.

Use the GitHub REST/GraphQL API with GITHUB_TOKEN to read labels, existing comments, review threads, human replies, update or resolve threads, update the summary, and post only deduplicated, necessary feedback.
