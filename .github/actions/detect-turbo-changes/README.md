# Detect Turbo Changes Action

A reusable GitHub Action that detects which packages have changed using Turborepo's dry-run feature.

## Features

- Runs `turbo run build --filter='...[HEAD^]' --dry-run=json` to detect changes
- Excludes `//` entries from the package list
- Outputs both a JSON array of changed packages and a boolean indicating if any changes exist
- Can be used across multiple workflows

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `filter` | Turbo filter to use | No | `...[HEAD^]` |
| `working-directory` | Working directory to run turbo from | No | `.` |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `changed-packages` | JSON array of changed package names (excluding `//`) | `["backend", "frontend", "db"]` |
| `has-changes` | Boolean indicating if any packages changed | `true` |
| `changeset-json` | Full turbo dry-run JSON output | Full JSON object |

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

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: ".bun-version"

      - name: Install dependencies
        run: bun install

      - name: Detect changes
        id: changes
        uses: ./.github/actions/detect-turbo-changes

      - name: Show results
        run: |
          echo "Changed packages: ${{ steps.changes.outputs.changed-packages }}"
          echo "Has changes: ${{ steps.changes.outputs.has-changes }}"
```

### With Custom Filter (Pull Request)

```yaml
- name: Detect changes
  uses: ./.github/actions/detect-turbo-changes
  with:
    filter: ${{ github.event_name == 'pull_request' && '...[origin/main]' || '...[HEAD^]' }}
```

### Conditional Job Execution Based on Package Changes

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      changed-packages: ${{ steps.changes.outputs.changed-packages }}
      changed-backend: ${{ steps.check-backend.outputs.changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: ".bun-version"

      - run: bun install

      - name: Detect changes
        id: changes
        uses: ./.github/actions/detect-turbo-changes

      - name: Check if backend changed
        id: check-backend
        if: contains(fromJSON(steps.changes.outputs.changed-packages), 'backend')
        run: echo "changed=true" >> $GITHUB_OUTPUT

  deploy-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.changed-backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        run: echo "Deploying backend..."
```

### Check Multiple Packages

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      changed-packages: ${{ steps.changes.outputs.changed-packages }}
      changed-backend: ${{ steps.check-backend.outputs.changed }}
      changed-frontend: ${{ steps.check-frontend.outputs.changed }}
      changed-db: ${{ steps.check-db.outputs.changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: ".bun-version"

      - run: bun install

      - name: Detect changes
        id: changes
        uses: ./.github/actions/detect-turbo-changes

      - name: Check backend
        id: check-backend
        if: contains(fromJSON(steps.changes.outputs.changed-packages), 'backend')
        run: echo "changed=true" >> $GITHUB_OUTPUT

      - name: Check frontend
        id: check-frontend
        if: contains(fromJSON(steps.changes.outputs.changed-packages), 'frontend')
        run: echo "changed=true" >> $GITHUB_OUTPUT

      - name: Check db
        id: check-db
        if: contains(fromJSON(steps.changes.outputs.changed-packages), 'db')
        run: echo "changed=true" >> $GITHUB_OUTPUT

  deploy-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.changed-backend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying backend..."

  deploy-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.changed-frontend == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying frontend..."

  run-migrations:
    needs: detect-changes
    if: needs.detect-changes.outputs.changed-db == 'true'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running migrations..."
```

## How It Works

1. **Run Turbo Dry-Run**: Executes `turbo run build --filter='<filter>' --dry-run=json` to get a JSON representation of which packages are affected
2. **Parse Output**: Extracts the `packages` array from the JSON output
3. **Filter Results**: Removes any entries that start with `//` (internal Turbo references)
4. **Export Outputs**: Provides the filtered list as a JSON array and a boolean for conditional logic

## Requirements

- Turborepo must be installed and configured in your repository
- Dependencies must be installed before running this action
- `fetch-depth: 0` is recommended for accurate change detection

## Example Output

If `backend` and `db` packages have changed:

```json
{
  "changed-packages": ["backend", "db"],
  "has-changes": "true"
}
```

If no packages have changed:

```json
{
  "changed-packages": [],
  "has-changes": "false"
}
```

## Notes

- The action uses `jq` for JSON parsing (available by default on GitHub runners)
- Package names are extracted from Turbo's output and exclude any entries starting with `//`
- The action handles multi-line JSON output properly for GitHub Actions
- For pull requests, use the filter `...[origin/main]` to compare against the base branch
- For push events, use `...[HEAD^]` to compare against the previous commit
