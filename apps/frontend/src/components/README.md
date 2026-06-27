# Frontend Components

This folder contains reusable React components for the frontend app. Components
here are shared across routes and feature surfaces, while lower-level design
system primitives live in `@namefi-astra/ui`.

```text
components/
  dropdowns/    # menu and account dropdown surfaces
  i18n/         # locale switching UI
  *.tsx         # shared app-specific components
```

Prefer existing UI primitives and local patterns before adding new component
abstractions. Components that expose user-facing strings should use the app
message namespaces instead of inline copy.
