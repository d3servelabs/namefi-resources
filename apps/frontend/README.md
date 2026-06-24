# Frontend

## Development

### Environment Setup

1. Copy the environment template:
```bash
cp .env.template .env
```

2. Update the `.env` file with your environment variables:
```
ENVIRONMENT=development    # Options: local, preview, development, production
```

Note: Configuration is managed in two ways:
- Non-secret configuration is version controlled and managed in the codebase
- Secret environment variables are managed through Infisical. You can override any Infisical variables by adding them to your `.env` file.

⚠️ **Security Warning**: Never expose sensitive secrets in the frontend code. Any environment variables used in the frontend will be visible to users. Keep all sensitive operations in the backend.

### Running the Application

To run the frontend in development mode:

```bash
INFISICAL_TOKEN={TOKEN} bun with-env dev
```

## Guides

- [Performance instrumentation (RUM)](docs/dev-guides/performance-instrumentation.md) —
  real-user timing for hydration, sidebar activation, and sign-in. Profile any
  session (incl. production) with `?perf=1`; a sampled share of traffic ships to
  Datadog for percentiles.
