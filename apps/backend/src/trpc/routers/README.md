# Routers

This folder contains tRPC router modules for trpc. Routers define API procedures,
compose domain services, and should keep validation close to the procedure boundary.

## File Relationships

- Router modules define transport-facing API boundaries and compose lower-level services.
- Keep request validation at the boundary and shared business rules in service or lib modules.

## Structure

```text
apps/backend/src/trpc/routers/
|-- README.md
|-- __tests__/
|-- admin/
|-- domainConfig/
|-- hunt/
|-- orpc/
|-- adminRouter.ts
|-- ai-generation-references.ts
|-- aiRouter.ts
|-- analyticsRouter.ts
|-- announcementsRouter.ts
|-- apiKeysRouter.ts
|-- appRouter.ts
|-- authRouter.ts
|-- cartsRouter.ts
|-- ... 21 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
