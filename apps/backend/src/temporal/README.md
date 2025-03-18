# Temporal Integration

This directory contains the Temporal workflow engine integration for the Namefi Astra backend. Temporal is a workflow orchestration platform that enables reliable execution of long-running business logic.

## Structure

The Temporal integration is organized as follows:

```
temporal/
├── activities/        # Activity implementations that do actual work
├── shared/            # Shared configurations and constants
├── workers/           # Worker setup and management
├── workflows/         # Workflow definitions that orchestrate activities
├── main.temporal.ts   # Main entry point for the Temporal server
└── workers.router.ts  # HTTP endpoints for managing workers
```

## Components

### Activities

Activities are the building blocks of Temporal workflows. They represent individual units of work that can be executed by workers. Activities are defined in the `activities/` directory:

- `greet.activities.ts`: Simple greeting activity for demonstration

### Workflows

Workflows are durable, reliable functions that orchestrate the execution of activities. They maintain their state even through service failures. Workflows are defined in the `workflows/` directory:

- `helloWorld.workflow.ts`: Example workflow that executes greeting activities

### Workers

Workers are processes that execute activities and workflows. They poll task queues for work assignments. Our worker configuration is in the `workers/` directory:

- `createWorker.ts`: Factory function to create and configure workers
- `index.ts`: Worker initialization and registration

### Shared Configuration

Common configuration used across the Temporal integration:

- `enums.ts`: Contains constants for task queues and worker types
- `commonRunningOptions.ts`: Contains activity execution options

### HTTP API

The `workers.router.ts` file provides HTTP endpoints for monitoring and managing workers:

- `GET /workers/health`: Check worker health status
- `POST /workers/stop`: Stop all running workers
- `POST /workers/start`: Start all stopped workers

## Running Locally

### Prerequisites

1. Make sure you have Temporal server running locally or have access to a remote Temporal server
2. Configure environment variables with your Temporal server details

### Development Mode

To run the Temporal service in development mode with auto-reload:

```bash
bun run dev:temporal
```

This starts the Temporal service using `tsx watch` for hot reloading.

### Configuration

The Temporal connection is configured through environment variables:

- `TEMPORAL_API_URL`: URL of the Temporal server
- `TEMPORAL_NAMESPACE`: Namespace to use for workflows
- `TEMPORAL_API_KEY`: API key for authentication (if required)
- `API_AUTH_KEY`: API key for the HTTP endpoints

## Interacting with Workflows

You can interact with workflows programmatically using the Temporal client. See the `@temporalio/client` package documentation for details.

### HTTP API Examples

Check worker health status:
```bash
curl http://localhost:3000/workers/health
```

Stop all running workers:
```bash
curl -X POST http://localhost:3000/workers/stop \
  -H "x-api-key: YOUR_API_KEY"
```

Start all stopped workers:
```bash
curl -X POST http://localhost:3000/workers/start \
  -H "x-api-key: YOUR_API_KEY"
```

Add the `wait=true` query parameter to wait for the operation to complete:
```bash
curl -X POST "http://localhost:3000/workers/start?wait=true" \
  -H "x-api-key: YOUR_API_KEY"
```

## Production Deployment

For production deployment, build the application and then run the Temporal service:

```bash
# Build the application
bun run build:prod

# Run the Temporal service
bun run start:temporal
```

## Adding New Workflows and Activities

1. Create new activity files in the `activities/` directory
2. Create new workflow files in the `workflows/` directory
3. Export them from the respective index.ts files
4. Register your activities with the appropriate worker in `workers/index.ts` 