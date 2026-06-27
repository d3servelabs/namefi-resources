# Vercel React Best Practices Rules

This folder contains reference rules used by the Vercel React best-practices skill. The
files are organized by concern, such as async behavior, bundle size, rendering,
rerenders, and server patterns.

## File Relationships

- `SKILL.md` files are agent entrypoints; adjacent Markdown files are references loaded by those skills.
- Run `bun run rulesync:generate` after source changes so generated agent files stay aligned.

## Structure

```text
.rulesync/skills/vercel-react-best-practices/rules/
|-- README.md
|-- advanced-event-handler-refs.md
|-- advanced-init-once.md
|-- advanced-use-latest.md
|-- async-api-routes.md
|-- async-defer-await.md
|-- async-dependencies.md
|-- async-parallel.md
|-- async-suspense-boundaries.md
|-- bundle-barrel-imports.md
|-- bundle-conditional.md
|-- bundle-defer-third-party.md
|-- bundle-dynamic-imports.md
|-- bundle-preload.md
|-- client-event-listeners.md
|-- ... 43 more
```

## Maintenance

Update this README when skill routing, reference layout, or RuleSync generation behavior
changes.
