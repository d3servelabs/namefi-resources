# oRPC

This folder contains tRPC router modules for orpc. Routers define API procedures,
compose domain services, and should keep validation close to the procedure boundary.

## File Relationships

- Router modules define transport-facing API boundaries and compose lower-level services.
- Keep request validation at the boundary and shared business rules in service or lib modules.

## Structure

```text
apps/backend/src/trpc/routers/orpc/
|-- README.md
|-- balanceRouter.orpc.ts
|-- dnsRecordsRouter.orpc.ts
|-- domainConfigRouter.orpc.ts
|-- eip712.orpc.ts
|-- ordersRouter.orpc.ts
|-- outboundRouter.orpc.ts
|-- searchRouter.orpc.ts
|-- siwe.orpc.ts
|-- userDataRouter.orpc.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
