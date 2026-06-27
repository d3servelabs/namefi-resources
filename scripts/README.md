# Scripts

Utility entrypoints for local development, validation, deployment diagnostics,
and CI-adjacent maintenance tasks that run from the repository root.

```text
scripts/
├── check-readmes.ts        # README coverage precheck for changed folders
├── dev/                    # Local multi-service dev runner
├── *frontend* / lighthouse # Frontend performance and Lighthouse helpers
├── *nightly* / gsc*        # Operational reporting and indexing diagnostics
└── prepare/link/run-sgr    # Setup and validation wrappers
```

Most scripts are invoked through root `package.json` commands so callers inherit
the expected Bun runtime, working directory, and repo-level configuration.
