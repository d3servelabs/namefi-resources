import type {
  AnnouncementCondition,
  ConditionOperator,
  PriceOperand,
  TldPriceKind,
} from '@namefi-astra/common/announcements-condition';
import { describe, expect, it } from 'vitest';
import type { TldPricingInfo } from '../namefi-registry';
import {
  evaluateAnnouncementCondition,
  evaluateConditionWithDetail,
  normalizeTld,
} from './evaluate-condition';

// Fixed pricing table. `.com` has no leading dot, `.xyz` does — exercising
// normalization on the table side. `.io` has a null registration price.
const PRICING: TldPricingInfo[] = [
  {
    tld: 'com',
    registrarKey: 'DYNADOT' as TldPricingInfo['registrarKey'],
    registrationPriceUsdPerYear: 8.95,
    renewalPriceUsdPerYear: 12.99,
    transferPriceUsdPerYear: 9.5,
  },
  {
    tld: '.xyz',
    registrarKey: 'DYNADOT' as TldPricingInfo['registrarKey'],
    registrationPriceUsdPerYear: 2,
    renewalPriceUsdPerYear: 12,
    transferPriceUsdPerYear: 12,
  },
  {
    tld: 'io',
    registrarKey: 'DYNADOT' as TldPricingInfo['registrarKey'],
    registrationPriceUsdPerYear: null,
    renewalPriceUsdPerYear: 32,
    transferPriceUsdPerYear: 32,
  },
];

function makeDeps() {
  let calls = 0;
  return {
    deps: {
      getPricingTable: async () => {
        calls += 1;
        return PRICING;
      },
    },
    callCount: () => calls,
  };
}

const tld = (
  t: string,
  priceKind: TldPriceKind = 'registration',
): PriceOperand => ({ kind: 'tld', tld: t, priceKind });

const lit = (amountUsd: number): PriceOperand => ({
  kind: 'literal',
  amountUsd,
});

const compareCond = (
  left: PriceOperand,
  operator: ConditionOperator,
  right: PriceOperand,
): AnnouncementCondition => ({ type: 'PRICE_COMPARE', left, operator, right });

describe('normalizeTld', () => {
  it('strips leading dots, lowercases, and trims', () => {
    expect(normalizeTld('.COM')).toBe('com');
    expect(normalizeTld('..Xyz')).toBe('xyz');
    expect(normalizeTld('  io ')).toBe('io');
    expect(normalizeTld('com')).toBe('com');
  });
});

describe('evaluateAnnouncementCondition', () => {
  it('returns true when there is no condition', async () => {
    const { deps } = makeDeps();
    await expect(evaluateAnnouncementCondition(null, deps)).resolves.toBe(true);
    await expect(evaluateAnnouncementCondition(undefined, deps)).resolves.toBe(
      true,
    );
  });

  it('compares two literals without fetching pricing', async () => {
    const { deps, callCount } = makeDeps();
    await expect(
      evaluateAnnouncementCondition(compareCond(lit(9), 'lte', lit(10)), deps),
    ).resolves.toBe(true);
    await expect(
      evaluateAnnouncementCondition(compareCond(lit(11), 'lte', lit(10)), deps),
    ).resolves.toBe(false);
    // Literal-only operands never touch the pricing table.
    expect(callCount()).toBe(0);
  });

  it('resolves a TLD registration price against a literal', async () => {
    const { deps } = makeDeps();
    // .com registration is 8.95
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'lte', lit(9)),
        deps,
      ),
    ).resolves.toBe(true);
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'gt', lit(9)),
        deps,
      ),
    ).resolves.toBe(false);
  });

  it('compares two TLD prices', async () => {
    const { deps } = makeDeps();
    // .com reg (8.95) > .xyz reg (2)
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'gt', tld('xyz')),
        deps,
      ),
    ).resolves.toBe(true);
    // .com reg (8.95) < .xyz renewal (12)
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'lt', tld('xyz', 'renewal')),
        deps,
      ),
    ).resolves.toBe(true);
  });

  it('normalizes the condition TLD when matching the pricing table', async () => {
    const { deps } = makeDeps();
    // Condition uses ".COM"; table key is "com".
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('.COM'), 'eq', lit(8.95)),
        deps,
      ),
    ).resolves.toBe(true);
    // Condition uses "xyz"; table key is ".xyz".
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('xyz'), 'eq', lit(2)),
        deps,
      ),
    ).resolves.toBe(true);
  });

  it('returns false when a TLD is not in the pricing table', async () => {
    const { deps } = makeDeps();
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('doesnotexist'), 'lte', lit(100)),
        deps,
      ),
    ).resolves.toBe(false);
  });

  it('returns false when the chosen price kind is null', async () => {
    const { deps } = makeDeps();
    // .io registration price is null.
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('io'), 'lte', lit(100)),
        deps,
      ),
    ).resolves.toBe(false);
    // ...but .io renewal (32) resolves fine.
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('io', 'renewal'), 'lte', lit(100)),
        deps,
      ),
    ).resolves.toBe(true);
  });

  it('treats `eq` with a small float tolerance', async () => {
    const { deps } = makeDeps();
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'eq', lit(8.95)),
        deps,
      ),
    ).resolves.toBe(true);
    await expect(
      evaluateAnnouncementCondition(
        compareCond(tld('com'), 'eq', lit(8.96)),
        deps,
      ),
    ).resolves.toBe(false);
  });

  it('honors every operator', async () => {
    const { deps } = makeDeps();
    const cases: Array<[ConditionOperator, boolean]> = [
      ['lt', true], // 8.95 < 9
      ['lte', true], // 8.95 <= 9
      ['gt', false], // 8.95 > 9
      ['gte', false], // 8.95 >= 9
      ['eq', false], // 8.95 == 9
    ];
    for (const [operator, expected] of cases) {
      await expect(
        evaluateAnnouncementCondition(
          compareCond(tld('com'), operator, lit(9)),
          deps,
        ),
      ).resolves.toBe(expected);
    }
  });
});

describe('evaluateConditionWithDetail', () => {
  it('describes a null condition', async () => {
    const { deps } = makeDeps();
    await expect(evaluateConditionWithDetail(null, deps)).resolves.toEqual({
      met: true,
      detail: 'No condition — always shows',
    });
  });

  it('includes resolved values in the detail', async () => {
    const { deps } = makeDeps();
    const result = await evaluateConditionWithDetail(
      compareCond(tld('com'), 'lte', lit(9)),
      deps,
    );
    expect(result.met).toBe(true);
    expect(result.detail).toContain('.com registration ($8.95)');
    expect(result.detail).toContain('≤');
    expect(result.detail).toContain('$9');
  });

  it('flags an unresolved price', async () => {
    const { deps } = makeDeps();
    const result = await evaluateConditionWithDetail(
      compareCond(tld('doesnotexist'), 'lte', lit(9)),
      deps,
    );
    expect(result.met).toBe(false);
    expect(result.detail).toContain('(no price)');
    expect(result.detail).toContain('price unavailable');
  });
});
