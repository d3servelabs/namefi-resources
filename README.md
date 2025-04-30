# namefi-astra

[![codecov](https://codecov.io/gh/d3servelabs/namefi-astra/branch/main/graph/badge.svg)](https://codecov.io/gh/d3servelabs/namefi-astra)

To install dependencies:

```bash
bun install
```

This project was created using `bun init` in bun v1.2.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Local dev

- Scripts running for local dev should have `ENVIRONMENT=local <command>`, either when you run them or when you define them in package.json::scripts, for Exmaple;

```json
{
    ...
    "scripts": {
        "dev": "ENVIRONMENT=local next dev"
    }
    ...
}
```

- Frontend Apps should have ports >= 5000 and Backend Apps >= 3000
  - apps/frontend => localhost:5000
  - apps/backend#main => localhost:3000
  - apps/backend#temporal => localhost:3001

### To Start the app locally

```bash
# Backend
bun --cwd=apps/frontend dev

#Frontend
bun --cwd=apps/backend dev
```

If you need Temporal, you need to have it installed locally [installation](https://learn.temporal.io/getting_started/typescript/dev_environment/?os=linux#set-up-a-local-temporal-service-for-development-with-temporal-cli)

```bash
# in separate shells
temporal server start-dev
# in separate shells
bun --cwd=apps/backend  dev:temporal
```
