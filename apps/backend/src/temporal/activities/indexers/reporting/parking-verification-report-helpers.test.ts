import { describe, expect, it } from 'vitest';
import type { ParkedDomainVerification } from '#lib/domains/parking-verification';
import type { CheckStatus } from '#lib/domains/parking-verification-logic';
import type { ParkedDomainProblem } from '../../../../mail/templates/parked-domain-verification-report';
import {
  buildProblemsCsv,
  csvEscape,
  toProblem,
} from './parking-verification-report-helpers';

function makeResult(
  overrides: Partial<ParkedDomainVerification> = {},
): ParkedDomainVerification {
  const ok = (status: CheckStatus, detail = '') => ({ status, detail });
  return {
    domain: 'example.com' as ParkedDomainVerification['domain'],
    punycode: 'example.com',
    mode: 'park',
    forwardTo: null,
    publiclyVerifiable: true,
    dns: {
      ...ok('pass'),
      expected: { a: '', aaaa: '' },
      observed: { a: [], aaaa: [] },
      gateEnabled: true,
      gateTxtPresent: true,
      redirectTxt: null,
    },
    ssl: {
      ...ok('pass'),
      issuer: null,
      validFrom: null,
      validTo: null,
      daysUntilExpiry: null,
      hostnameCovered: true,
      authorized: true,
    },
    serving: { ...ok('pass'), httpStatus: 200 },
    redirect: {
      ...ok('pass'),
      expectedTarget: null,
      observedTarget: null,
      redirectChain: [],
    },
    overall: 'pass',
    checkedAt: '2026-06-22T08:00:00.000Z',
    ...overrides,
  };
}

describe('toProblem', () => {
  it('returns null for healthy (pass/skipped) results', () => {
    expect(toProblem(makeResult({ overall: 'pass' }))).toBeNull();
    expect(toProblem(makeResult({ overall: 'skipped' }))).toBeNull();
  });

  it('extracts only the warn/fail checks into issues', () => {
    const result = makeResult({
      overall: 'fail',
      ssl: {
        status: 'fail',
        detail: 'Certificate expired.',
        issuer: null,
        validFrom: null,
        validTo: null,
        daysUntilExpiry: null,
        hostnameCovered: false,
        authorized: false,
      },
      serving: { status: 'fail', detail: 'unreachable', httpStatus: null },
    });
    const problem = toProblem(result);
    expect(problem).not.toBeNull();
    expect(problem?.overall).toBe('fail');
    expect(problem?.ssl).toBe('fail');
    expect(problem?.issues).toEqual([
      'SSL: Certificate expired.',
      'Serving: unreachable',
    ]);
  });
});

describe('csvEscape', () => {
  it('wraps in quotes and doubles inner quotes', () => {
    expect(csvEscape('plain')).toBe('"plain"');
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape(42)).toBe('"42"');
  });
});

describe('buildProblemsCsv', () => {
  it('emits a header row plus one escaped row per problem', () => {
    const problems: ParkedDomainProblem[] = [
      {
        domain: 'bad.com',
        mode: 'park',
        overall: 'fail',
        dns: 'pass',
        ssl: 'fail',
        serving: 'fail',
        redirect: 'pass',
        issues: ['SSL: expired', 'Serving: down'],
      },
    ];
    const csv = buildProblemsCsv(problems);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      '"Domain","Mode","Overall","DNS","SSL","Serving","Redirect","Issues"',
    );
    expect(lines[1]).toBe(
      '"bad.com","park","fail","pass","fail","fail","pass","SSL: expired | Serving: down"',
    );
  });
});
