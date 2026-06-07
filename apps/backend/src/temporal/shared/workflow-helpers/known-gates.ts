import {
  type RunWithDecisionGateOptions,
  runWithDecisionGate,
} from './decision-gate';

/**
 * Central registry of "known" decision gates, keyed by a stable class id
 * (`GateKind`). A known gate carries:
 * - a `gateKind` tag + `evidenceParams` surfaced in the armed-gate context, so
 *   the admin side can gather decision-support evidence on demand (registrar
 *   details, "is it in our system", RDAP/WHOIS) — that gathering happens in the
 *   API process, NOT here, keeping this module (and the generic helper) free of
 *   domain dependencies; and
 * - optional per-kind defaults (e.g. a single auto-retry) applied by
 *   {@link runWithKnownGate}.
 *
 * `GateKind` is distinct from a gate's `interactionId` (the per-run wait-point
 * key): a kind identifies the *class* of gate across workflows and runs, which
 * is what the admin evidence registry keys off. `interactionId` defaults to the
 * `gateKind` unless the caller overrides it.
 */
export type GateKind = 'register-or-import-poll' | 'register-or-import-submit';

interface KnownGateDefaults {
  /** Auto-retry policy applied unless the caller overrides {@link RunWithDecisionGateOptions.autoRetry}. */
  autoRetry?: { maxAttempts?: number };
}

/**
 * Per-kind defaults. Empty entries are fine — a known gate need only exist here
 * to be tagged; auto-retry/timeouts that vary per call (e.g. REGISTER vs IMPORT)
 * stay at the call site. Add the matching admin-side evidence gatherer in
 * `apps/backend/src/trpc/routers/admin/gate-evidence/registry.ts`.
 */
const KNOWN_GATE_DEFAULTS: { [K in GateKind]?: KnownGateDefaults } = {};

export type RunWithKnownGateOptions<T, R = T> = RunWithDecisionGateOptions<
  T,
  R
> & {
  /** Which known gate this is — tags the armed gate and selects per-kind defaults. */
  gateKind: GateKind;
};

/**
 * Thin wrapper over {@link runWithDecisionGate} for a {@link GateKind}: tags the
 * armed gate with `gateKind` (so the admin side can gather evidence), defaults
 * `interactionId` to the kind, and folds in the kind's defaults. Caller options
 * win over the defaults.
 */
export async function runWithKnownGate<T, R = T>(
  opts: RunWithKnownGateOptions<T, R>,
): Promise<R> {
  const defaults = KNOWN_GATE_DEFAULTS[opts.gateKind];
  return runWithDecisionGate<T, R>({
    ...opts,
    interactionId: opts.interactionId ?? opts.gateKind,
    // Deep-merge so a caller passing a partial `autoRetry` (e.g. only
    // `shouldRetry`) keeps the kind's default `maxAttempts`.
    autoRetry:
      defaults?.autoRetry || opts.autoRetry
        ? { ...defaults?.autoRetry, ...opts.autoRetry }
        : undefined,
  });
}
