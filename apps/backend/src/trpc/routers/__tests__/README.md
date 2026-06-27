# Routers Tests

This folder contains tRPC router modules for tests. Routers define API procedures,
compose domain services, and should keep validation close to the procedure boundary.

## File Relationships

- Router modules define transport-facing API boundaries and compose lower-level services.
- Keep request validation at the boundary and shared business rules in service or lib modules.

## Structure

```text
apps/backend/src/trpc/routers/__tests__/
|-- README.md
|-- aiRouter.test.ts
|-- analyticsRouter.e2e.test.ts
|-- domainConfigRouter.test.ts
|-- ordersRouter.analytics.test.ts
|-- searchRouter.test.ts
|-- usersRouter.test.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
