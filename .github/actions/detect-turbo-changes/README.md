# Detect Turbo Changes Action

A reusable GitHub Action that detects affected packages with `turbo query affected`.

## What It Does

- Compares two git refs with `turbo query affected`
- Supports task-scoped detection, package filters, or both
- Outputs a JSON array of affected package names
- Optionally falls back to the requested package filters when specific files are touched

## Inputs

| Input | Description | Required | Default |
| --- | --- | --- | --- |
| `base-ref` | Base git ref for comparison | No | `HEAD^` |
| `head-ref` | Head git ref for comparison | No | `HEAD` |
| `tasks` | Whitespace or newline separated Turbo tasks | No | `build` |
| `packages` | Optional whitespace or newline separated package filters | No | `` |
| `fallback-files` | Optional whitespace or newline separated file paths that force the selected package filters to be treated as changed when touched | No | `` |
| `filter` | Deprecated legacy filter like `...[HEAD^]`; only kept for compatibility | No | `` |
| `working-directory` | Working directory to run Turbo from | No | `.` |

## Outputs

| Output | Description | Example |
| --- | --- | --- |
| `changed-packages` | JSON array of affected package names | `["@namefi-astra/backend"]` |
| `has-changes` | Boolean indicating whether any packages were affected | `true` |

## Usage

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect backend build changes
        id: changes
        uses: ./.github/actions/detect-turbo-changes
        with:
          base-ref: ${{ github.event.before }}
          head-ref: ${{ github.sha }}
          packages: "@namefi-astra/backend"
          fallback-files: |
            bun.lock
            package.json
            bunfig.toml
            .bun-version

      - name: Show results
        run: |
          echo "Changed packages: ${{ steps.changes.outputs.changed-packages }}"
          echo "Has changes: ${{ steps.changes.outputs.has-changes }}"
```

## Notes

- Prefer `base-ref` and `head-ref`; `filter` is deprecated.
- Use `fetch-depth: 0` so both refs and tags are available.
- When `tasks` and `packages` are both set, Turbo returns affected tasks that match both filters.
- `fallback-files` is intended for dependency-manager files like `bun.lock` where a conservative deploy is safer than a false negative.
