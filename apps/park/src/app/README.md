# Park App Router

This folder contains Next.js App Router routes and app-level files for the parked-domain
app. Keep route logic small and preserve the host/domain behavior expected by public
parked pages.

## File Relationships

- Route files map to the public parked-domain app surface.
- Keep host-aware logic small here and move reusable behavior into `apps/park/src/lib`.

## Structure

```text
apps/park/src/app/
|-- README.md
|-- favicon.ico
|-- globals.css
|-- layout.tsx
|-- page.tsx
|-- robots.ts
|-- sitemap.ts
```

## Maintenance

Update this README when files are reorganized, new module groups appear, or the
ownership of this folder changes.
