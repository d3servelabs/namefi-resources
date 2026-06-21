# Security & supply-chain monitoring

How `namefi-astra` continuously watches for vulnerable and malicious dependencies.
The repo is **private**, on the **GitHub Team** plan (no Advanced Security), so the
stack is built from free, native, and open-source tooling.

## What runs, and what it catches

| Layer | Mechanism | Catches | Cadence |
| --- | --- | --- | --- |
| Dependabot alerts + security updates | Native GitHub (repo settings) | Known CVEs in deps; opens fix PRs | Continuous |
| Dependabot version updates | [`.github/dependabot.yml`](../.github/dependabot.yml) | Outdated Actions + deps | Weekly |
| `bun audit` + OSV-Scanner + Trivy | [`security-scan.yml`](../.github/workflows/security-scan.yml) | Dependency + filesystem/Dockerfile CVEs, leaked secrets | Weekly + on lockfile PRs |
| OpenSSF Scorecard | [`scorecard.yml`](../.github/workflows/scorecard.yml) | Supply-chain posture regressions | Weekly |
| Socket | GitHub App | **Malicious** packages — typosquats, install scripts, new net/fs access (often no CVE) | Every PR |
| Harden-Runner (egress audit) | Step in the workflows above | Anomalous CI egress (compromised build step) | Every run |

Known-CVE detection and **supply-chain-attack** detection are different problems:
the `audit`/OSV/Trivy/Dependabot layers cover the former; **Socket + Harden-Runner +
SHA-pinning + Scorecard** cover the latter (malicious code usually has no CVE).

## One-time setup (manual, not in code)

### 1. Enable Dependabot alerts + automatic security fixes

```bash
gh api -X PUT repos/d3servelabs/namefi-astra/vulnerability-alerts
gh api -X PUT repos/d3servelabs/namefi-astra/automated-security-fixes
```

Query open alerts any time (the "API to poll" option):

```bash
gh api repos/d3servelabs/namefi-astra/dependabot/alerts \
  --jq '.[] | select(.state=="open") | {pkg:.dependency.package.name, sev:.security_advisory.severity, ghsa:.security_advisory.ghsa_id}'
```

### 2. Install the Socket GitHub App

1. Go to <https://socket.dev>, sign in with GitHub, and install the **Socket Security** app.
2. Grant it read access to `d3servelabs/namefi-astra`.
3. It then comments on every PR that changes the lockfile, flagging risky package
   behavior. (Optional later: add `socket-security/socket-action` to gate CI.)

### 3. (Optional) Dedicated Slack alert channel

`security-scan.yml` posts to `SLACK_WEBHOOK_SECURITY_CHANNEL_URL` if set, otherwise
falls back to `SLACK_WEBHOOK_RELEASE_CHANNEL_URL`. To route alerts to a dedicated
channel, create an incoming webhook in Slack and store it as a repo secret —
**never paste the URL into a PR, issue, or chat**:

```bash
# Reads the value from a hidden prompt (or pipe from a file) — not echoed.
gh secret set SLACK_WEBHOOK_SECURITY_CHANNEL_URL --repo d3servelabs/namefi-astra
```

### 4. (Optional) Add a Scorecard token

`scorecard.yml` falls back to `GITHUB_TOKEN`. For fuller private-repo coverage,
add a classic PAT with `repo` read scope as the `SCORECARD_TOKEN` repo secret.

## Deferred hardening (follow-up PRs)

These edit critical deploy paths and are intentionally **not** in the monitoring PR:

- **Container image scanning (#4):** add a Trivy image scan step to each
  `build-push-*` / `deploy-backend*` workflow, right after the image is built and
  before it is pushed — covers `backend`, `indexer`, `ns-json-api`, `listmonk`.
- **Repo-wide SHA-pinning + Harden-Runner (#5):** pin every Action in all existing
  workflows to a commit SHA (today they use mutable tags like `@v6`/`@v2`), and add
  `step-security/harden-runner` to `release.yml` and `deploy-*.yml`. Dependabot's
  `github-actions` updates then keep the pins fresh.

## Validate before trusting

- ✅ Verified via manual dispatch (run 27920091882): OSV-Scanner parses `bun.lock`,
  and `bun audit` surfaces advisories (it flagged a critical `@orpc/client` issue).
- Dependabot uses the native `bun` ecosystem (GA 2025-02-13); note the known quirk
  that it may rewrite the `configVersion` field in `bun.lock` on update PRs.
