# RuleSync

Source rules and skills that generate agent guidance for AGENTS.md, Claude,
Cursor, Codex, and OpenCode surfaces.

```text
.rulesync/
├── rules/   # Rule source files; every Markdown file here is compiled as a rule
└── skills/  # Repo-local skills copied into generated agent skill folders
```

Edit files here first, then run `bun run rulesync:generate` so generated
agent/editor outputs stay in sync. `rules/` cannot contain its own `README.md`
because RuleSync treats every Markdown file in that folder as a rule.
