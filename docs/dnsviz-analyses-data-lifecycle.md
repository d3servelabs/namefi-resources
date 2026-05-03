# DNSViz Analyses — Data Lifecycle

How rows in the `dnsviz_analyses` table behave across reruns, how to preserve
history when you need it, and when rows are pruned.

## Storage model

The `dnsviz_analyses` table holds **one row per `(normalized_domain_name,
analysis_date)`**. The unique constraint enforcing this lives in
[`packages/db/src/schema.ts`](../packages/db/src/schema.ts):

```sql
unique (normalized_domain_name, analysis_date)
```

`analysis_date` is the workflow's start date in UTC, formatted as
`YYYY-MM-DD`. Both the daily-digest and on-demand workflows compute it from
`workflow.workflowInfo().startTime` unless an explicit `analysisDate`
override is passed (only the on-demand workflow accepts the override).

## Overwrite behavior

`analyzeDomainsBatch` (in
[`apps/backend/src/temporal/activities/indexers/dnsviz.activities.ts`](../apps/backend/src/temporal/activities/indexers/dnsviz.activities.ts))
inserts each row with
`ON CONFLICT (normalized_domain_name, analysis_date) DO UPDATE` — every
column except `id` and `created_at` gets replaced with the new run's values
(`status`, `summary`, `errors_count`, `warnings_count`, `probe_data`,
`grok_data`, `error_message`, `workflow_run_id`, `expires_at`,
`updated_at`). So:

| Scenario | Behavior |
|---|---|
| Re-run on-demand for a domain **later the same UTC day** | **Overwrites** today's row. Old `grok_data` / `error_message` are gone. |
| Run on-demand for a domain **on a different UTC day** | **New row.** The previous day's row stays untouched until cleanup deletes it. |
| Run on-demand on the same day the daily 04:00 UTC run already wrote a row | **Overwrites** the daily row. The on-demand result wins; `workflow_run_id` then points at the on-demand workflow. |
| Pass an explicit `analysisDate` override (e.g. yesterday's date) for a backfill | **Overwrites** that specific date's row if present, otherwise creates one for that date. |

A re-run on the same day at 23:55 UTC vs one at 00:05 UTC the next morning
land on different rows — `analysis_date` is computed from the workflow's
start time, not the wall clock at row-write time.

## Preserving multiple analyses for the same domain

Same-day reruns clobber. If you need before/after snapshots — say to compare
a domain pre- and post-fix — pick one of:

- **Run them on different days.** The most natural option; most operators
  do this implicitly because their fix takes longer than 24 hours to verify.
- **Pass an explicit `analysisDate` override.** The on-demand workflow
  input accepts `analysisDate?: string` (`YYYY-MM-DD`). Use a synthetic
  date for one of the runs (e.g. set `analysisDate` to a date you know
  isn't otherwise occupied) so it doesn't collide.

If "preserve every run, ever" becomes a real requirement: drop the unique
constraint, change the upsert to a plain `INSERT`, and add a
`DISTINCT ON (normalized_domain_name) … ORDER BY analysis_started_at DESC`
to the digest-email query. Not done today because the digest is keyed on
"latest verdict per domain per day" semantics.

## Retention

`expires_at` is recomputed on every upsert as `analysis_date +
retention_days` (default 30, configurable per workflow input). The
[`dnsvizCleanupWorkflow`](../apps/backend/src/temporal/workflows/dnsviz-cleanup.workflow.ts)
runs daily at 06:00 UTC and deletes rows where `expires_at < now()`. So a
re-run effectively extends the retention window for that day's row.

## Idempotency, replay safety

Because rows upsert deterministically on `(domain, analysis_date)`, both
workflows are safe to retry without duplicating data. A worker crash that
restarts a batch ends up with the same final row count for that day; the
last successful run wins.
