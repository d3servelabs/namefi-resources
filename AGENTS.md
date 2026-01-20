# Repository Agent Guide (Performance Focus)

This repo has heavy Next.js dev compile costs. When making changes, follow these rules to avoid regressions.

## Frontend Performance Guardrails

- Keep `"use client"` at the leaf. Do not add it to `apps/frontend/src/app/layout.tsx`,
  route files, or large shared components unless unavoidable.
- Avoid adding new providers to the root layout. Prefer route groups (e.g. `(marketing)` vs `(app)`)
  to keep `/` minimal.
- Avoid barrel exports across server/client boundaries. Prefer direct leaf imports, especially in
  `apps/frontend/src/app/**` and shared client components.
- Do not expand Tailwind class scanning scope beyond `apps/frontend/src` unless required. If you must
  add new content sources, keep them explicit and minimal.
- Avoid importing heavy dependencies into the app shell (`layout.tsx`, `Main`, sidebars, global providers).
  Use `next/dynamic` or move logic to server components where possible.
- Avoid adding global CSS/plugins that increase processing in `apps/frontend/src/app/globals.css`.
- Do not add large folders (or backups of `.next`) inside the repo; they can be picked up by tooling.

## When Changing / Adding Features

- Prefer server components by default; only move logic to client components when needed.
- Keep data loading on the server; pass minimal serialized props to client components.
- Avoid `export *` in frequently imported modules for the frontend.
- If you touch `/` or app shell code, run the benchmark script to ensure no regression.

## Benchmarking

Use the benchmark script for cold/hot timing:

```
INFISICAL_TOKEN=... bun scripts/bench-frontend-dev.ts --runs 3
```

Reports are written to `apps/frontend/.benchmarks/` (ignored by git).
