import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GATE_LOCK_HOLD_MS,
  DEFAULT_MAX_PENDING_WAIT_MS,
  NONCE_LOCK_HEARTBEAT_INTERVAL_MS,
  computeNonceLockAbsoluteMaxMs,
  computeNonceLockTtlMs,
} from './nonce-lock-ttl';

describe('computeNonceLockAbsoluteMaxMs', () => {
  // Production race-budget defaults: lanes 5, maxRepins 2, fail 180s, stagger 8s,
  // minChild 30s. The pending-wait + gate-hold contributions are zeroed here so
  // these cases assert the RACE-budget math in isolation (their own test below).
  const Defaults = {
    triesPerPin: 5,
    maxRepins: 2,
    maxTimeoutPerTryMs: 180_000,
    staggerMs: 8_000,
    minChildTimeoutMs: 30_000,
    chainId: 8453,
    maxPendingWaitMs: 0,
    gateLockHoldMs: 0,
  } as const;

  it('models (maxRepins+1) sequential rounds + per-round overhead (not lanes×budget)', () => {
    // roundWallClock = max(180000, 4*8000+30000=62000) = 180000.
    expect(computeNonceLockAbsoluteMaxMs(Defaults)).toBe(
      (2 + 1) * (180_000 + 200_000) + 3000,
    );
  });

  it('does NOT multiply by lanes — lanes=1 and lanes=5 match when stagger does not bind', () => {
    expect(computeNonceLockAbsoluteMaxMs({ ...Defaults, triesPerPin: 1 })).toBe(
      computeNonceLockAbsoluteMaxMs({ ...Defaults, triesPerPin: 5 }),
    );
  });

  it("uses the last staggered lane's finish when it exceeds the round budget", () => {
    // lanes 30: (30-1)*8000 + 30000 = 262000 > 180000 → roundWallClock = 262000.
    expect(
      computeNonceLockAbsoluteMaxMs({
        ...Defaults,
        triesPerPin: 30,
        maxRepins: 0,
        perRoundOverheadMs: 0,
        leewayMs: 0,
      }),
    ).toBe(262_000);
  });

  it('honors perRoundOverheadMs and leewayMs overrides', () => {
    expect(
      computeNonceLockAbsoluteMaxMs({
        ...Defaults,
        maxRepins: 1,
        perRoundOverheadMs: 0,
        leewayMs: 5000,
      }),
    ).toBe((1 + 1) * 180_000 + 5000);
  });

  it('maxRepins=0 → exactly one round (no re-pin)', () => {
    expect(
      computeNonceLockAbsoluteMaxMs({
        ...Defaults,
        maxRepins: 0,
        perRoundOverheadMs: 0,
        leewayMs: 0,
      }),
    ).toBe(180_000);
  });

  it('accepts but ignores chainBlockTimeMs (seam — uniform today)', () => {
    expect(
      computeNonceLockAbsoluteMaxMs({ ...Defaults, chainBlockTimeMs: 2000 }),
    ).toBe(
      computeNonceLockAbsoluteMaxMs({ ...Defaults, chainBlockTimeMs: 12_000 }),
    );
  });

  it('adds the pending-wait + gate-hold windows on top of the race budget', () => {
    const raceOnly = computeNonceLockAbsoluteMaxMs(Defaults); // pending=gate=0
    const withWindows = computeNonceLockAbsoluteMaxMs({
      ...Defaults,
      maxPendingWaitMs: undefined, // → DEFAULT_MAX_PENDING_WAIT_MS
      gateLockHoldMs: undefined, // → DEFAULT_GATE_LOCK_HOLD_MS
    });
    expect(withWindows).toBe(
      raceOnly + DEFAULT_MAX_PENDING_WAIT_MS + DEFAULT_GATE_LOCK_HOLD_MS,
    );
  });

  it('defaults the pending/gate windows to 30 min + 1 h', () => {
    expect(DEFAULT_MAX_PENDING_WAIT_MS).toBe(30 * 60_000);
    expect(DEFAULT_GATE_LOCK_HOLD_MS).toBe(1 * 60 * 60_000);
  });
});

describe('computeNonceLockTtlMs', () => {
  it('is three heartbeat intervals (refresh = TTL / 3)', () => {
    expect(computeNonceLockTtlMs(30_000)).toBe(90_000);
    expect(computeNonceLockTtlMs(NONCE_LOCK_HEARTBEAT_INTERVAL_MS)).toBe(
      90_000,
    );
  });
});
