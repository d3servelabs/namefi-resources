# AST-grep in Namefi Astra

This project uses AST-grep for static code analysis and to enforce coding standards. AST-grep works by analyzing the abstract syntax tree (AST) of your code to find patterns and enforce rules.

## Getting Started

AST-grep is installed as a dev dependency in the project. You can run it using:

```bash
# Run all rules
bun sgr

# Run a specific rule
bun sgr -r temporal-type-safety

# Apply automatic fixes
bun sgr --fix
```

## Available Rules

The rules are located in the `.sgr/rules` directory:

- `temporal-type-safety.yaml`: Ensures that Temporal workflows use the `typedProxyActivities` helper function for type safety and consistent task queue usage.
- `ensure-currency-annotations.yaml`: Enforces that monetary values have comments specifying currency and unit of measurement.

## Integration with Validation

AST-grep scans are integrated with our validation pipeline:

- `bun validate`: Runs typecheck, Biome formatting check, sherif, and AST-grep scan
- Pre-commit hook: Runs AST-grep scan on staged files
- Pre-push hook: Runs the full validation including AST-grep

## Adding New Rules

To add a new rule:

1. Create a YAML file in `.sgr/rules/` directory
2. Define patterns to match code structures
3. Add utility functions in `.sgr/utils/` if needed
4. Update the `.sgr/README.md` file

Example rule structure:

```yaml
id: my-new-rule
language: TypeScript
message: "Description of what this rule enforces"
severity: warning
rule:
  pattern: |
    pattern to match
  negative-pattern: |
    pattern that is acceptable
fix:
  template: |
    suggested fix template
```

For more information, see the [AST-grep documentation](https://ast-grep.github.io/).