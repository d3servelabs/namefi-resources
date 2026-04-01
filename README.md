# namefi-astra
[![codecov](https://codecov.io/gh/d3servelabs/namefi-astra/branch/main/graph/badge.svg)](https://codecov.io/gh/d3servelabs/namefi-astra)
[![Test](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml)
[![Validate](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml)

## Other Docs

- [Logs Access](./docs/logs.md)
- [Dev Guides](./docs/dev-guides.md)

## Turbo Build Graph

The root `turbo.json` includes a virtual `transit` task to make build impact
propagate across workspace package boundaries without inventing fake outputs.
`@namefi-astra/backend#build`, `@namefi-astra/frontend#build`, and the default
`build` task all depend on `transit`, so shared package changes still mark the
right app builds as affected. `transit` does not execute side effects of its
own; it exists only to preserve correct dependency edges for change detection.

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
