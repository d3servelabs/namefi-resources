# namefi-astra
[![codecov](https://codecov.io/gh/d3servelabs/namefi-astra/branch/main/graph/badge.svg)](https://codecov.io/gh/d3servelabs/namefi-astra)
[![Test](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml)
[![Validate](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml)

## Other Docs

- [Logs Access](./docs/logs.md)
- [Dev Guides](./docs/dev-guides.md)

## Deployments

How each app reaches production:

### Frontend & backend (`apps/frontend`, `apps/backend`)

Released by promoting `main` → the `prod` branch via the **Create Release** workflow
(`.github/workflows/release.yml`). It runs on a nightly cron (`0 11 * * *`, 11:00 UTC) or a manual
`workflow_dispatch`, bumps the app versions, and opens/merges a `main → prod` release PR. The `prod`
branch drives the production deployment.

### Park (`apps/park`) — parked-domain landing pages

**The park production deploy is a manual step. It is _not_ automated, _not_ triggered by pushing
`main`, and _not_ part of the Create Release flow.**

- `apps/park/vercel.json` enables Vercel Git deploys **only on `main`**
  (`deploymentEnabled: { "*": false, "main": true }`). Every push to `main` therefore creates a
  **preview/dev**-target park build — never a production one. The `prod` branch does **not** build
  park, so the release / `prod`-branch flow has no effect on it.
- Real parked domains (e.g. `82228.net`) resolve via DNS to Namefi's **Caddy** reverse proxy, which
  forwards to the project's production custom domains (`park.namefi.io`, `park.astra.namefi.io`, …).
  Those custom domains follow the project's **current production deployment** in the Vercel project
  **`namefi-astra-park`** — which only changes when someone **manually promotes a `main` build to
  production**. Historically this is done every few weeks by a team member.

**To ship park to production** (after your change is merged to `main`):

1. **Vercel Dashboard** — open the `namefi-astra-park` project → **Deployments** → pick the latest
   `Ready` deployment built from `main` → **Redeploy → Production**. Prefer _Redeploy → Production_
   (a fresh production build) over promoting an existing **preview/dev** build: a dev build runs with
   **dev** environment variables (e.g. pointing park at the dev backend).
2. **Vercel CLI** — from a checkout at the target `main` commit, with the directory linked to the
   `namefi-astra-park` project:
   ```bash
   vercel deploy --prod --scope d3servelabs
   ```

> **Two steps, not one.** A *production-target build* is not automatically the *current* production
> deployment — and the custom domains only follow the **current** one. `vercel deploy --prod` and the
> dashboard "Redeploy → Production" both build **and** make it current. If you instead create a
> production build out-of-band (e.g. via the REST API), you must also **Promote** it to current
> production (dashboard "Promote to Production", or `POST /v10/projects/{id}/promote/{deploymentId}`),
> otherwise parked domains keep serving the previous build (look for a large `age:` / `x-vercel-cache: HIT`).

After promoting, verify the live page on a **real parked domain** (e.g. `https://82228.net`). The bare
`*.vercel.app` deployment host is blocked by the Vercel firewall (`x-vercel-mitigated: deny`), so the
deployment URL itself returns `403` — always test through an actual parked domain.

## Quick Start

Once you have all dependencies installed

First, export one single infisical token for authenticating your dev secrets

```bash
export INFISICAL_SERVICE_TOKEN=<your-infisical-token> # Ask Victor for it
```

Then, start the dev server

```bash
infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun run dev
```

The dev runner will automatically allocate an available port block and display the URLs for each service. By default (first run), services are available at:

1. Backend API at [http://localhost:3000](http://localhost:3000)
2. Frontend at [http://localhost:3001](http://localhost:3001)
3. Email Preview at [http://localhost:3002](http://localhost:3002)
4. Temporal UI at [http://localhost:3005](http://localhost:3005)

Ports are dynamically assigned to allow multiple dev instances to run concurrently (3000-3005, 3100-3105, etc.).

## Installing the prerequisites and dependencies

You would likely need to install the following prerequisites:

- [Node.js](https://nodejs.org/en/download/)
- [Temporal](https://learn.temporal.io/getting_started/typescript/dev_environment/?os=linux#set-up-a-local-temporal-service-for-development-with-temporal-cli)
- [Bun](https://bun.sh/docs/installation)
- [Infisical CLI](https://infisical.com/docs/cli/installation)
- [Docker](https://docs.docker.com/get-docker/) (for containerized services and running tests)
- [Act](https://github.com/nektos/act) (for running GitHub Actions workflows locally)
- [Git](https://git-scm.com/downloads) (for version control and Git hooks)
- [nvm](https://github.com/nvm-sh/nvm#install--update-script) (to manage Node.js versions)
- [GitHub CLI](https://cli.github.com/) (for triggering remote workflows) (optional)
