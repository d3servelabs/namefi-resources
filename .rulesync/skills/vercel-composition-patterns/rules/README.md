# Vercel Composition Patterns Rules

This folder contains reference rules used by the Vercel composition-patterns skill. The
files describe React composition, state ownership, and component API patterns that
agents should apply when refactoring UI code.

## File Relationships

- `SKILL.md` files are agent entrypoints; adjacent Markdown files are references loaded by those skills.
- Run `bun run rulesync:generate` after source changes so generated agent files stay aligned.

## Structure

```text
.rulesync/skills/vercel-composition-patterns/rules/
|-- README.md
|-- architecture-avoid-boolean-props.md
|-- architecture-compound-components.md
|-- patterns-children-over-render-props.md
|-- patterns-explicit-variants.md
|-- state-context-interface.md
|-- state-decouple-implementation.md
|-- state-lift-state.md
```

## Maintenance

Update this README when skill routing, reference layout, or RuleSync generation behavior
changes.
