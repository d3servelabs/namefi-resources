# AST-grep Rules

This directory contains custom AST-grep rules for enforcing code patterns and best practices in the Namefi Astra codebase.

## Directory Structure

- `rules/`: Contains pattern matching rules that enforce coding standards
- `utils/`: Contains utility functions that AST-grep can use during pattern matching

## Available Rules

- `temporal-type-safety.yaml`: Ensures that Temporal workflows use the `typedProxyActivities` helper function for type safety and consistent task queue usage.

## Adding New Rules

To add a new rule:

1. Create a new YAML file in the `rules/` directory
2. Define the rule with `id`, `language`, `message`, and `pattern`
3. Optionally add a fix template and examples
4. Update this README to document the new rule

## Running AST-grep

To run these rules against your codebase:

```bash
# Install AST-grep if not already installed
npm install -g @ast-grep/cli

# Run all rules
sgr scan

# Run a specific rule
sgr scan -r temporal-type-safety
```

For more information about AST-grep, see the [official documentation](https://ast-grep.github.io/). 