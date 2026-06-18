import { describe, expect, it } from 'vitest';
import {
  type ExpirationComparison,
  compareExpiration,
  computeRenewalVerdict,
} from './renewal-verdict';

/** Build a comparison fixture; the `expiration` string is irrelevant to the verdict. */
const cmp = (
  reflectsRenewal: boolean | null,
  matchesExpected: boolean | null,
): ExpirationComparison => ({
  expiration: '2027-01-01T00:00:00.000Z',
  reflectsRenewal,
  matchesExpected,
});

const base = { previousValid: true, durationInYears: 1 };

describe('computeRenewalVerdict', () => {
  describe('terminal-failure precedence (FAILED / ERROR)', () => {
    it('FAILED + no source moved → not-landed', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(false, null), cmp(false, null)],
        opStatus: 'FAILED',
        ...base,
      });
      expect(v.state).toBe('not-landed');
      expect(v.sourcesWithData).toBe(2);
      expect(v.sourcesReflectingRenewal).toBe(0);
      expect(v.summary).toContain('FAILED');
      expect(v.summary).toContain('RETRY');
    });

    it('ERROR + no source moved → not-landed', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(false, null)],
        opStatus: 'ERROR',
        ...base,
      });
      expect(v.state).toBe('not-landed');
    });

    it('FAILED is NOT overridden to landed when a source shows a (stale) bump → inconclusive conflict', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, true), cmp(false, null)],
        opStatus: 'FAILED',
        ...base,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.sourcesReflectingRenewal).toBe(1);
      expect(v.summary).toContain('Conflicting signals');
    });

    it('FAILED + an unexpected-amount move → inconclusive conflict mentioning a different duration', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, false)],
        opStatus: 'ERROR',
        ...base,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.sourcesMovedUnexpectedAmount).toBe(1);
      expect(v.summary).toContain('different duration');
    });
  });

  describe('SUCCESSFUL operation status', () => {
    it('SUCCESSFUL + corroborating source → landed', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, true)],
        opStatus: 'SUCCESSFUL',
        ...base,
      });
      expect(v.state).toBe('landed');
      expect(v.summary).toContain('SUCCESSFUL');
      expect(v.summary).toContain('match the expected new date');
    });

    it('SUCCESSFUL with sources still old → landed (propagation note)', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(false, null)],
        opStatus: 'SUCCESSFUL',
        ...base,
      });
      expect(v.state).toBe('landed');
      expect(v.summary).toContain('propagating');
    });

    it('SUCCESSFUL wins even when a source moved to an unexpected date', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, false)],
        opStatus: 'SUCCESSFUL',
        ...base,
      });
      expect(v.state).toBe('landed');
    });
  });

  describe('non-terminal / unknown operation status', () => {
    it('a source moved to the expected date → landed', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, true)],
        opStatus: undefined,
        ...base,
      });
      expect(v.state).toBe('landed');
      expect(v.summary).toContain('appears to have landed');
    });

    it('reflecting + an extra unexpected mover → landed with a confirm-the-duration note', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, true), cmp(true, false)],
        opStatus: 'IN_PROGRESS',
        ...base,
      });
      expect(v.state).toBe('landed');
      expect(v.sourcesReflectingRenewal).toBe(1);
      expect(v.sourcesMovedUnexpectedAmount).toBe(1);
      expect(v.summary).toContain('unexpected date');
    });

    it('only an unexpected-amount move (no clean reflect) → inconclusive', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, false)],
        opStatus: undefined,
        previousValid: true,
        durationInYears: 3,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.sourcesReflectingRenewal).toBe(0);
      expect(v.sourcesMovedUnexpectedAmount).toBe(1);
      expect(v.summary).toContain('3 year');
    });

    it('all sources still old → inconclusive (keep polling)', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(false, null), cmp(false, null)],
        opStatus: 'IN_PROGRESS',
        ...base,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.summary).toContain('still show the old date');
      expect(v.summary).toContain('IN_PROGRESS');
    });

    it('no readable sources at all → inconclusive', () => {
      const v = computeRenewalVerdict({
        comparisons: [],
        opStatus: undefined,
        ...base,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.sourcesWithData).toBe(0);
      expect(v.summary).toContain('Could not read any expiration source');
    });
  });

  describe('missing baseline', () => {
    it('no pre-renewal baseline → inconclusive even if a source has a null reflect', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(null, null)],
        opStatus: undefined,
        previousValid: false,
        durationInYears: 1,
      });
      expect(v.state).toBe('inconclusive');
      expect(v.summary).toContain('baseline');
    });
  });

  describe('matchesExpected gating', () => {
    it('reflectsRenewal=true but matchesExpected=false is NOT counted as reflecting', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, false)],
        opStatus: undefined,
        ...base,
      });
      expect(v.sourcesReflectingRenewal).toBe(0);
      expect(v.sourcesMovedUnexpectedAmount).toBe(1);
    });

    it('reflectsRenewal=true with matchesExpected=null (no expected) still counts as reflecting', () => {
      const v = computeRenewalVerdict({
        comparisons: [cmp(true, null)],
        opStatus: undefined,
        ...base,
      });
      expect(v.sourcesReflectingRenewal).toBe(1);
      expect(v.state).toBe('landed');
    });
  });

  describe('gate-agnostic summary (reused for both extend gates)', () => {
    it('never hard-codes "RESPOND SUCCESSFUL" in any landed summary', () => {
      const successful = computeRenewalVerdict({
        comparisons: [cmp(true, true)],
        opStatus: 'SUCCESSFUL',
        ...base,
      });
      const reflecting = computeRenewalVerdict({
        comparisons: [cmp(true, true)],
        opStatus: undefined,
        ...base,
      });
      for (const v of [successful, reflecting]) {
        expect(v.state).toBe('landed');
        expect(v.summary).not.toContain('RESPOND SUCCESSFUL');
        expect(v.summary).toContain('RESPOND with the verified value');
      }
    });
  });
});

describe('compareExpiration', () => {
  const previous = new Date('2026-01-01T00:00:00.000Z');
  const expected = new Date('2027-01-01T00:00:00.000Z'); // previous + 1 year

  it('reflectsRenewal: strictly later than previous', () => {
    expect(
      compareExpiration(
        new Date('2027-01-01T00:00:00.000Z'),
        previous,
        expected,
      ).reflectsRenewal,
    ).toBe(true);
    expect(
      compareExpiration(previous, previous, expected).reflectsRenewal,
    ).toBe(false); // same instant is not "later"
  });

  it('reflectsRenewal is null when there is no previous baseline', () => {
    expect(
      compareExpiration(new Date('2027-01-01T00:00:00.000Z'), null, expected)
        .reflectsRenewal,
    ).toBeNull();
  });

  it('matchesExpected: within the 2-day tolerance', () => {
    // 1 day off → within tolerance.
    expect(
      compareExpiration(
        new Date('2027-01-02T00:00:00.000Z'),
        previous,
        expected,
      ).matchesExpected,
    ).toBe(true);
    // 4 days off → outside tolerance.
    expect(
      compareExpiration(
        new Date('2027-01-05T00:00:00.000Z'),
        previous,
        expected,
      ).matchesExpected,
    ).toBe(false);
  });

  it('matchesExpected is null when no expected date can be computed', () => {
    expect(
      compareExpiration(new Date('2027-01-01T00:00:00.000Z'), previous, null)
        .matchesExpected,
    ).toBeNull();
  });
});
