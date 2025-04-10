# Database Migration Procedure

## Decision

When updating database schema:

- Include migration with the same PR as the schema change, but don't execute them in production
- Run `bun validate:db:migrate` which includes a migratability check with neon branched database-snapshot
- CI/CD must check `bun validate:db:migrate`:
  - Before each time updating PR drafts
  - Before merging PRs

## Purpose

This procedure ensures that:
1. Schema changes are always accompanied by proper migrations
2. Migrations are validated in a test environment before deployment
3. Breaking changes are caught early in the development process

## Implementation

The CI/CD pipeline will automatically run the validation steps to enforce this procedure. 