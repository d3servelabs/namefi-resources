import { differenceInCalendarDays } from 'date-fns';

/**
 * Pure verdict logic for the renewal (extend-registration) decision gates, kept
 * dependency-light (only `date-fns`) and separate from the gatherer in
 * `registry.ts` — which pulls in the registrar / on-chain / db clients — so the
 * decision tree can be unit-tested in isolation. See `renewal-verdict.test.ts`.
 */

/**
 * A successful renewal pushes the expiration later by ~`durationInYears`;
 * registrar/registry expiration math can differ from a naive `addYears` by a day
 * or two, so `matchesExpected` allows a small slop.
 */
export const EXPIRATION_MATCH_TOLERANCE_DAYS = 2;

export type ExpirationComparison = {
  expiration: string;
  /** Later than the pre-renewal expiration → the renewal landed at this source. */
  reflectsRenewal: boolean | null;
  /** Within tolerance of `previous + durationInYears` → the bump is the expected size. */
  matchesExpected: boolean | null;
};

/** Compare one source's current expiration against the pre/expected dates. */
export function compareExpiration(
  current: Date,
  previous: Date | null,
  expected: Date | null,
): ExpirationComparison {
  return {
    expiration: current.toISOString(),
    reflectsRenewal: previous ? current.getTime() > previous.getTime() : null,
    matchesExpected: expected
      ? Math.abs(differenceInCalendarDays(current, expected)) <=
        EXPIRATION_MATCH_TOLERANCE_DAYS
      : null,
  };
}

export type RenewalVerdictState = 'landed' | 'not-landed' | 'inconclusive';

export type RenewalVerdict = {
  state: RenewalVerdictState;
  sourcesWithData: number;
  sourcesReflectingRenewal: number;
  sourcesMovedUnexpectedAmount: number;
  summary: string;
};

/**
 * Pure verdict computation for a renewal gate.
 *
 * A source counts as positive evidence only when it BOTH moved past the old date
 * (`reflectsRenewal`) AND landed near the expected new date (`matchesExpected !==
 * false`); a move to an unexpected date is tracked separately and never on its
 * own implies the renewal landed. The registrar operation's terminal status is
 * authoritative — a FAILED/ERROR operation is never overridden to "landed" by
 * (possibly stale) source movements.
 *
 * Gate-agnostic: the gatherer backs both the renewal status-poll gate (RESPOND
 * is a terminal `OperationStatus`) and the expiration-poll gate (RESPOND is an
 * ISO expiration), so the summary describes the renewal STATE and nudges toward
 * "RESPOND with the verified value" rather than a gate-specific payload.
 */
export function computeRenewalVerdict({
  comparisons,
  opStatus,
  previousValid,
  durationInYears,
}: {
  comparisons: ExpirationComparison[];
  opStatus: string | undefined;
  previousValid: boolean;
  durationInYears: number;
}): RenewalVerdict {
  const sourcesWithData = comparisons.length;
  const sourcesReflectingRenewal = comparisons.filter(
    (s) => s.reflectsRenewal === true && s.matchesExpected !== false,
  ).length;
  const sourcesMovedUnexpectedAmount = comparisons.filter(
    (s) => s.reflectsRenewal === true && s.matchesExpected === false,
  ).length;
  const opTerminalFailure = opStatus === 'FAILED' || opStatus === 'ERROR';

  let state: RenewalVerdictState;
  let summary: string;
  if (opTerminalFailure) {
    // Registrar explicitly failed — never claim "landed" off source movement.
    if (sourcesReflectingRenewal > 0 || sourcesMovedUnexpectedAmount > 0) {
      state = 'inconclusive';
      summary = `Conflicting signals: the registrar operation reports ${opStatus}, but ${
        sourcesReflectingRenewal + sourcesMovedUnexpectedAmount
      }/${sourcesWithData} expiration source(s) show a later date — possibly stale/cached from a prior renewal${
        sourcesMovedUnexpectedAmount > 0
          ? ', or a different duration than requested'
          : ''
      }. Verify the registrar directly before deciding.`;
    } else {
      state = 'not-landed';
      summary = `The registrar operation reports ${opStatus} and no expiration source moved to the expected new date. The renewal likely did not land — RETRY to re-poll, or CANCEL to fail.`;
    }
  } else if (opStatus === 'SUCCESSFUL') {
    state = 'landed';
    summary = `The registrar operation reports SUCCESSFUL${
      sourcesReflectingRenewal > 0
        ? ` and ${sourcesReflectingRenewal}/${sourcesWithData} expiration sources match the expected new date`
        : ' (the new expiration may still be propagating to other sources)'
    }. RESPOND with the verified value to continue.`;
  } else if (sourcesReflectingRenewal > 0) {
    state = 'landed';
    summary = `The renewal appears to have landed — ${sourcesReflectingRenewal}/${sourcesWithData} expiration sources match the expected post-renewal date${
      opStatus ? ` (operation status ${opStatus})` : ''
    }.${
      sourcesMovedUnexpectedAmount > 0
        ? ` Note: ${sourcesMovedUnexpectedAmount} other source(s) moved but to an unexpected date — confirm the duration.`
        : ''
    } RESPOND with the verified value to continue.`;
  } else if (!previousValid) {
    // No pre-renewal baseline → reflectsRenewal/matchesExpected are unavailable.
    state = 'inconclusive';
    summary =
      'No pre-renewal expiration baseline was supplied, so the renewal could not be confirmed by comparison. Check the registrar operation status and the raw expirations below.';
  } else if (sourcesMovedUnexpectedAmount > 0) {
    state = 'inconclusive';
    summary = `${sourcesMovedUnexpectedAmount}/${sourcesWithData} expiration source(s) moved but to an unexpected date (not ~${
      Number.isFinite(durationInYears) ? durationInYears : '?'
    } year(s) past the old expiry). Verify the registrar before deciding.`;
  } else {
    state = 'inconclusive';
    summary =
      sourcesWithData === 0
        ? 'Could not read any expiration source. Verify the registrar state manually before deciding.'
        : `Expiration sources still show the old date${
            opStatus ? ` and the operation status is ${opStatus}` : ''
          }. RETRY to keep polling, or verify at the registrar before deciding.`;
  }

  return {
    state,
    sourcesWithData,
    sourcesReflectingRenewal,
    sourcesMovedUnexpectedAmount,
    summary,
  };
}
