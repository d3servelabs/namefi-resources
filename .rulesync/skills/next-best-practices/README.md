# Next Best Practices

This folder contains the repo-local copy of the Next.js best-practices agent skill.
`SKILL.md` is the entrypoint, and the sibling Markdown files are topic references that
agents load only when a task needs that area.

## File Relationships

- `SKILL.md` files are agent entrypoints; adjacent Markdown files are references loaded by those skills.
- Run `bun run rulesync:generate` after source changes so generated agent files stay aligned.

## Structure

```text
.rulesync/skills/next-best-practices/
|-- README.md
|-- async-patterns.md
|-- bundling.md
|-- data-patterns.md
|-- debug-tricks.md
|-- directives.md
|-- error-handling.md
|-- file-conventions.md
|-- font.md
|-- functions.md
|-- hydration-error.md
|-- image.md
|-- metadata.md
|-- parallel-routes.md
|-- route-handlers.md
|-- ... 6 more
```

## Maintenance

Update this README when skill routing, reference layout, or RuleSync generation behavior
changes.
