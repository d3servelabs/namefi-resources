# Frontend Benchmark (Next.js dev cold/hot)

This benchmark uses `scripts/bench-frontend-dev.ts` to capture cold and hot compile timings from the Next.js dev server logs.

## Prereqs
- Bun installed.
- `INFISICAL_SERVICE_TOKEN` exported (or pass a custom `--dev-cmd`).

## Quick start
```
export INFISICAL_SERVICE_TOKEN=...
bun scripts/bench-frontend-dev.ts
```

The script:
- Deletes `apps/frontend/.next` before each run to force cold compiles.
- Starts its own dev server (do not run `bun dev` separately).
- Hits the configured routes twice per run (cold then hot).
- Writes a report and per-run logs under `apps/frontend/.benchmarks/`.

## Output
- Report: `apps/frontend/.benchmarks/next-dev-bench-<timestamp>.md`
- Logs: `apps/frontend/.benchmarks/run-XX.log`

## Common options
- `--runs 1`
- `--routes /,/orders,/tlds`
- `--base-url https://localhost:3001` (default frontend port, dynamically allocated)
- `--dev-cmd "infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun run dev"`
- `--output apps/frontend/.benchmarks/my-run.md`
- `--timeout-ms 180000` (dev server ready timeout)
- `--phase-timeout-ms 600000` (route compile timeout)

## Custom dev command examples

### Use HTTP (no experimental https)
```
bun scripts/bench-frontend-dev.ts \
  --dev-cmd "infisical run --token=$INFISICAL_SERVICE_TOKEN -- bun run dev" \
  --base-url http://localhost:3001
```
