# Determine Before Commit Action

A reusable GitHub Action that determines the correct "before" commit hash for change detection in GitHub workflows.

## Features

- Intelligently handles the `github.event.before` value
- Returns `HEAD^` when the before commit is all zeros (initial push, force push, or first commit)
- Returns the actual before commit hash in normal push scenarios
- Simplifies change detection logic in workflows
- Can be used across multiple workflows

## Problem It Solves

GitHub's `github.event.before` can be `0000000000000000000000000000000000000000` or empty in certain scenarios:
- Initial push to a new branch
- Force pushes that rewrite history
- First commit to a repository

This action provides a reliable "before" reference for change detection by falling back to `HEAD^` in these cases.

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `working-directory` | Working directory to run from | No | `.` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `before-commit` | The before commit hash or `HEAD^` | `abc1234` or `HEAD^` |

## Usage

### Basic Usage

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Determine before commit
        id: before
        uses: ./.github/actions/determine-before-commit

      - name: Show result
        run: |
          echo "Before commit: ${{ steps.before.outputs.before-commit }}"
```

### With Turbo Change Detection

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      changed-packages: ${{ steps.turbo.outputs.packages }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: ".bun-version"

      - run: bun install

      - name: Determine before commit
        id: before
        uses: ./.github/actions/determine-before-commit

      - name: Detect changed packages
        id: turbo
        run: |
          turbo run build --filter="...${{ steps.before.outputs.before-commit }}" --dry-run=json > turbo-output.json
          # Parse and use the output...
```

### With Custom Working Directory

```yaml
- name: Determine before commit
  id: before
  uses: ./.github/actions/determine-before-commit
  with:
    working-directory: ./apps/backend
```

### Complete Workflow Example

```yaml
name: Deploy on Changes

on:
  push:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      before-commit: ${{ steps.before.outputs.before-commit }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Determine before commit
        id: before
        uses: ./.github/actions/determine-before-commit

      - name: Check what changed
        run: |
          git diff --name-only ${{ steps.before.outputs.before-commit }} HEAD
```

## How It Works

1. **Check Before Value**: Reads `github.event.before` from the GitHub event context
2. **Validate**: Checks if the value is all zeros (`0000000000000000000000000000000000000000`) or empty
3. **Return Result**:
   - If invalid/empty: Returns `HEAD^` as a fallback
   - If valid: Returns the actual commit hash from `github.event.before`

## Requirements

- Repository must be checked out with sufficient history for comparison
- `fetch-depth: 0` is recommended for accurate change detection across all scenarios

## Example Outputs

### Normal Push
```yaml
before-commit: "abc123def456"  # Actual previous commit hash
```

### Initial Push or Force Push
```yaml
before-commit: "HEAD^"  # Fallback to previous commit
```

## Common Use Cases

### 1. Change Detection with Turbo
```yaml
- name: Determine before commit
  id: before
  uses: ./.github/actions/determine-before-commit

- name: Detect Turbo changes
  run: turbo run build --filter="...${{ steps.before.outputs.before-commit }}" --dry-run
```

### 2. Conditional Deployments
```yaml
- name: Determine before commit
  id: before
  uses: ./.github/actions/determine-before-commit

- name: Check for backend changes
  id: check-backend
  run: |
    if git diff --name-only ${{ steps.before.outputs.before-commit }} HEAD | grep "apps/backend/"; then
      echo "changed=true" >> $GITHUB_OUTPUT
    fi
```

### 3. File Path Filtering
```yaml
- name: Determine before commit
  id: before
  uses: ./.github/actions/determine-before-commit

- name: List changed files
  run: |
    git diff --name-only ${{ steps.before.outputs.before-commit }} HEAD
```

## Notes

- The action always outputs the value wrapped in quotes for safe usage in commands
- Works seamlessly with both initial and subsequent pushes
- Compatible with force pushes and branch deletions/recreations
- No external dependencies required (uses built-in bash and git)
