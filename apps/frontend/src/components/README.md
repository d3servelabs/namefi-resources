# Frontend Components

This folder contains reusable React components for the frontend app. Components
here are shared across routes and feature surfaces, while lower-level design
system primitives live in `@namefi-astra/ui`.

```text
components/
  dropdowns/    # menu, account dropdown, and quick-action surfaces
  sidebars/     # app navigation rail, drawer, and sidebar data wiring
  i18n/         # locale switching UI
  providers/    # client runtime providers and app-level context bridges
  dialogs/      # reusable modal flows
  *.tsx         # shared app-specific components
```

Prefer existing UI primitives and local patterns before adding new component
abstractions. Components that expose user-facing strings should use the app
message namespaces instead of inline copy.

Keep component-specific tests beside the component when behavior is local.
Reusable component states belong in `apps/frontend/src/stories/components`; full
route compositions belong in `apps/frontend/src/stories/pages`.
