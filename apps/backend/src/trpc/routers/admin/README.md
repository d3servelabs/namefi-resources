# Admin

This folder contains tRPC router modules for admin. Routers define API procedures,
compose domain services, and should keep validation close to the procedure boundary.

## File Relationships

- Router modules define transport-facing API boundaries and compose lower-level services.
- Keep request validation at the boundary and shared business rules in service or lib modules.

## Structure

```text
apps/backend/src/trpc/routers/admin/
|-- README.md
|-- export-tracking-evidence/
|-- gate-evidence/
|-- adminAnnouncementsRouter.ts
|-- adminDnsvizRouter.ts
|-- adminEmailsRouter.ts
|-- adminFinancialAnalyticsRouter.ts
|-- adminLoginHistoryRouter.ts
|-- adminNotificationsRouter.ts
|-- adminOrdersRouter.ts
|-- adminUsersRouter.ts
|-- aiCreditsRouter.ts
|-- autoRenewalRouter.ts
|-- bigQueryAuditRouter.ts
|-- bulkBurnRouter.ts
|-- ... 17 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
