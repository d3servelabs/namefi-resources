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

## Building the Application

### Using tsup with npm

This project uses [tsup](https://github.com/egoist/tsup) for building TypeScript code. To build the project:

```bash
# Development build
bun run build

# Production build (minified)
bun run build:prod
```

The compiled output will be in the `dist` directory.

### Building with Turborepo

As part of the monorepo, you can also build using Turborepo:

```bash
# Build just the backend
bun run turbo build --filter="@namefi-astra/backend"

# Build the backend and its dependencies
bun run turbo build --filter="@namefi-astra/backend..."
```

### Running the built application

Once built, you can run the application using:

```bash
bun run start
```

For local development with Bun:

```bash
INFISICAL_TOKEN={TOKEN} bun run with-env start:bun
```

## Docker

The project includes a Dockerfile with BuildKit support for creating optimized container images. The Dockerfile uses a hybrid multi-stage build approach:

- **Dependencies Stage**: Uses Bun for fast dependency installation
- **Builder Stage**: Uses Node.js 22 Alpine to build the application
- **Runtime Stage**: Creates a minimal production image with only the built application and production dependencies

This hybrid approach provides several benefits:
- Fast dependency installation using Bun
- Consistent Node.js 22 Alpine environment for building and running
- Smaller runtime image with only production dependencies
- Uses BuildKit caching for faster builds

### Building the Docker image

```bash
# Enable BuildKit and build the image
DOCKER_BUILDKIT=1 docker build -t namefi-astra-backend -f apps/backend/Dockerfile .
```

Note: The build command must be run from the monorepo root.

### Running the Docker container

```bash
docker run -p 3000:3000 --env-file apps/backend/.env namefi-astra-backend
```

This will start the container and expose the application on port 3000.
