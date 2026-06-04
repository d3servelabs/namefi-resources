/**
 * Reports whether the worker is running in a non-production environment
 * Used to gate test-only behavior — e.g. the
 * `runWithTestHarness` failure-injection wrap on the DNSSEC polls — to
 * non-production.
 *
 * This lives in an activity (not the workflow) on purpose: workflows must not
 * read `process.env` directly because that is non-deterministic on replay. The
 * activity result is recorded in history, so the workflow sees a stable value
 * across replays. Reads `process.env.ENVIRONMENT` to match the rest of the
 * backend (e.g. the skip-auth gate in `trpc/base.ts`).
 */
export async function isNonProductionEnvironment(): Promise<boolean> {
  const environment = process.env.ENVIRONMENT;
  return environment !== 'production';
}
