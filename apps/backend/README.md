# Backend

## Development

### Environment Setup

1. Copy the environment template:
```bash
cp .env.template .env
```

2. Update the `.env` file with your environment variables:
```
ENVIRONMENT=development    # Options: development, staging, production
```

Note: Configuration is managed in two ways:
- Non-secret configuration is version controlled and managed in the codebase under `src/lib/env/configs`
- Secret environment variables are managed through Infisical. You can override any Infisical variables by adding them to your `.env` file.

### Running the Server

To run the backend in development mode:

```bash
INFISICAL_TOKEN={TOKEN} bun run with-env dev
```
