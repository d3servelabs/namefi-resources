# Workflows

This folder contains GitHub Actions workflow entrypoints for repository validation,
preview environments, deployments, release promotion, and operational jobs. Each YAML
file is a separately triggerable workflow; shared behavior should live in repo scripts
or reusable workflow steps when possible.

## File Relationships

- Each workflow file is an independent automation entrypoint.
- Shared shell, Bun, or deployment logic should live in repo scripts rather than being copied into many workflows.

## Structure

```text
.github/workflows/
|-- README.md
|-- auto-approve-resources.yml
|-- auto-close-stale-prs.yml
|-- auto-merge-resources.yml
|-- build-push-ns-json-api.yml
|-- chromatic.yml
|-- cuj-e2e.yml
|-- debug-temporal-workflows.yml
|-- deploy-backend-vercel.yml
|-- deploy-backend.yml
|-- deploy-listmonk.yml
|-- deploy-ponder.yml
|-- deploy-resources.yml
|-- docker-layers.yml
|-- frontend-dev-benchmark.yml
|-- ... 17 more
```

## Maintenance

Update this README when workflow families, trigger conventions, or release/deploy
ownership changes.
