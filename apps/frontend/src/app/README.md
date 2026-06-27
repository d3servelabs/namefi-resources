# Frontend App Router

This folder contains Next.js App Router routes, layouts, and route-local modules for the
frontend app. Keep client components at the leaves and avoid adding broad providers or
heavy imports to shared layouts.

## File Relationships

- Route folders map to URL segments or route groups in the frontend app.
- Keep route-local components and helpers near their route until multiple routes need them.

## Structure

```text
apps/frontend/src/app/
|-- README.md
|-- abuse/
|-- admin/
|-- api/
|-- brand-kit/
|-- cart/
|-- claim/
|-- customer-support/
|-- dev-tools/
|-- dns-cache/
|-- domains/
|-- education/
|-- faucet/
|-- features/
|-- feed/
|-- ... 33 more
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
