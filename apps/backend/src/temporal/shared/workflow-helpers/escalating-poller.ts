import type { Duration } from '@temporalio/common';
import * as workflow from '@temporalio/workflow';
import { interruptibleSleep } from './interruptible-sleep';

/**
 * One phase of an escalating poll schedule.
 *
 * The poller stays in this phase — polling every `interval` — until the
 * cumulative slept time reaches `untilElapsedMs`, at which point it advances to
 * the next phase. The final phase's `untilElapsedMs` is effectively ignored: it
 * runs until the overall timeout.
 */
export interface PollPhase {
  /** Sleep between polls while in this phase (e.g. '10 seconds', '1 hour'). */
  interval: Duration;
  /** Advance to the next phase once summed elapsed ms reaches this value. */
  untilElapsedMs: number;
}

export interface EscalatingPollOptions<T> {
  /** Returns a truthy "done" payload, or null/undefined when not ready yet. */
  poll: () => Promise<T | null | undefined>;
  /**
   * Ordered phases from short → long (ascending `untilElapsedMs`). The first
   * phase whose `untilElapsedMs` is greater than the current elapsed is used;
   * once past every boundary, the last phase applies.
   */
  schedule: PollPhase[];
  /** Hard deadline in ms, compared against the sum of slept intervals. */
  overallTimeoutMs: number;
  /**
   * What to do when the deadline is reached without a ready result.
   * Defaults to throwing a non-retryable ApplicationFailure.
   */
  onTimeout?: { kind: 'throw' } | { kind: 'return'; value: T };
  /**
   * Optional early-exit hook, evaluated before each poll and used to interrupt
   * the inter-poll sleep. Lets the poller compose with a decision gate — e.g.
   * `() => gate.received !== null`. When it returns true the poll throws
   * {@link PollInterrupted} so the caller can branch on the external event.
   */
  interrupt?: () => boolean;
  /** Optional label used in log lines and the timeout/interrupt messages. */
  label?: string;
}

/**
 * Thrown by {@link escalatingPoll} when the `interrupt` predicate fires. The
 * caller is expected to catch this and act on whatever signalled the interrupt.
 */
export class PollInterrupted extends Error {
  constructor(label?: string) {
    super(`escalatingPoll${label ? ` "${label}"` : ''} interrupted`);
    this.name = 'PollInterrupted';
  }
}

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Deterministic `Duration` → milliseconds conversion.
 *
 * Numbers pass through unchanged (Temporal treats a numeric Duration as ms).
 * Strings support the common units (ms, s, m, h, d and their spelled-out
 * forms). Pure and side-effect free — safe to call during workflow replay.
 */
export function durationToMs(duration: Duration): number {
  if (typeof duration === 'number') return duration;

  const match = duration
    .trim()
    .match(
      /^(\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|secs?|seconds?|m|mins?|minutes?|h|hrs?|hours?|d|days?)$/i,
    );
  if (!match) {
    throw new Error(`escalating-poller: unsupported Duration "${duration}"`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'ms' || unit.startsWith('millisecond')) return value;
  if (unit === 's' || unit.startsWith('sec')) return value * MS_PER_SECOND;
  if (unit === 'm' || unit.startsWith('min')) return value * MS_PER_MINUTE;
  if (unit === 'h' || unit.startsWith('hr') || unit.startsWith('hour')) {
    return value * MS_PER_HOUR;
  }
  return value * MS_PER_DAY;
}

/**
 * Selects the active phase for a given elapsed time: the first phase whose
 * `untilElapsedMs` boundary has not yet been crossed, or the last phase once
 * every boundary is past.
 */
export function pickPhase(schedule: PollPhase[], elapsedMs: number): PollPhase {
  for (const phase of schedule) {
    if (elapsedMs < phase.untilElapsedMs) return phase;
  }
  return schedule[schedule.length - 1];
}

/**
 * Polls `poll` on an escalating cadence (short → long) until it returns a ready
 * value, the `interrupt` hook fires, or the overall deadline is reached.
 *
 * Elapsed time is tracked by summing the slept intervals — it never reads a
 * wall clock or random source — so the helper is fully replay-deterministic.
 *
 * @returns the first non-null poll result, or the configured timeout sentinel.
 * @throws {@link PollInterrupted} when `interrupt` returns true.
 * @throws a non-retryable ApplicationFailure on timeout when `onTimeout` is
 *   `{ kind: 'throw' }` (the default).
 */
export async function escalatingPoll<T>(
  options: EscalatingPollOptions<T>,
): Promise<T> {
  const {
    poll,
    schedule,
    overallTimeoutMs,
    onTimeout = { kind: 'throw' },
    interrupt,
    label,
  } = options;

  if (schedule.length === 0) {
    throw new Error('escalating-poller: schedule must have at least one phase');
  }

  let elapsedMs = 0;
  while (true) {
    const result = await poll();
    if (result != null) return result;

    if (interrupt?.()) {
      throw new PollInterrupted(label);
    }

    if (elapsedMs >= overallTimeoutMs) {
      if (onTimeout.kind === 'return') return onTimeout.value;
      throw workflow.ApplicationFailure.create({
        nonRetryable: true,
        type: 'polling/timeout',
        message: `escalatingPoll${label ? ` "${label}"` : ''} timed out after ${elapsedMs}ms`,
      });
    }

    const phase = pickPhase(schedule, elapsedMs);
    const sleepMs = Math.min(
      durationToMs(phase.interval),
      overallTimeoutMs - elapsedMs,
    );

    const sleepSummary = label ? `poll-wait:${label}` : 'poll-wait';
    if (interrupt) {
      await interruptibleSleep(sleepMs, interrupt, { summary: sleepSummary });
    } else {
      await workflow.sleep(sleepMs, { summary: sleepSummary });
    }
    elapsedMs += sleepMs;
  }
}
