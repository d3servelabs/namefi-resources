# @namefi-astra/common

Shared, **isomorphic** types and schemas used across frontend, backend, and packages.
This package must stay lightweight and safe to import in both browser and server contexts.

## What belongs here

- Zod schemas and inferred types used across services
- Pure data types (DTOs, enums, shared interfaces)
- Small, deterministic helpers with no side effects
- Shared validation logic used by multiple apps

Examples:
- Order/input schemas used by both API and UI
- Shared domain availability shapes
- Privy metadata schemas

## What does NOT belong here

- React/Next components or hooks
- Node-only code (`fs`, `path`, `crypto`, etc.)
- Network/database clients
- Environment/config loaders
- Heavy dependencies or large runtime logic
- Side-effectful modules (global mutations, timers, listeners)

## Guidelines

- Keep modules small and tree-shakeable.
- Avoid re-exporting from other packages; export local modules only.
- Prefer type-only imports when applicable.
- Keep runtime work minimal; avoid expensive computations.
- Ensure all exports are safe to use in both browser and server environments.

## Adding a new module

1. Add a new file under `src/`.
2. Export it from `index.ts`.
3. Ensure it’s isomorphic and dependency-light.

If the code is frontend-only or backend-only, it should live in the relevant app or package instead.
