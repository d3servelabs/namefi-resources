# namefi-astra
[![codecov](https://codecov.io/gh/d3servelabs/namefi-astra/branch/main/graph/badge.svg)](https://codecov.io/gh/d3servelabs/namefi-astra)
[![Test](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/test.yml)
[![Validate](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml/badge.svg)](https://github.com/d3servelabs/namefi-astra/actions/workflows/validate.yml)

## Quick Start

Once you have all dependencies installed

First, export one single infisical token for authenticating your dev secrets

```bash
export INFISICAL_SERVICE_TOKEN=<your-infisical-token> # Ask Victor for it
```

Then, start the dev server

```bash
infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun dev -- --experimental-https
```

Then you can validate your setup by accessing

1. the app frontend at [http://localhost:5050](http://localhost:5050)
2. the backend api server at [http://localhost:3000](http://localhost:3000)
3. the backend email server at [http://localhost:3005](http://localhost:3005)
4. the temporal server at [http://localhost:8233](http://localhost:8233)

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
