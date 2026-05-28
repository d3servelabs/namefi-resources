import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { deriveDnsvizStatus } from './parse-grok';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string): unknown {
  return JSON.parse(
    readFileSync(join(__dirname, '__fixtures__', name), 'utf8'),
  );
}

const samyxGrok = loadFixture('samyx.net.grok.json');
const nemilGrok = loadFixture('nemil.xyz.grok.json');
const namefiDevGrok = loadFixture('namefi.dev.grok.json');

describe('deriveDnsvizStatus', () => {
  it('returns SECURE for samyx.net (8 EXISTING_TYPE_NOT_IN_BITMAP errors filtered)', () => {
    const result = deriveDnsvizStatus(samyxGrok, 'samyx.net');
    expect(result.status).toBe('SECURE');
    expect(result.summary.delegationStatus).toBe('SECURE');
    expect(result.summary.zoneStatus).toBe('NOERROR');
    expect(result.summary.parentChainStatuses['net.']).toBe('SECURE');
    expect(result.summary.parentChainStatuses['samyx.net.']).toBe('SECURE');
    expect(result.errorsCount).toBe(0);
    expect(result.warningsCount).toBe(0);
  });

  it('returns SECURE for nemil.xyz (10 EXISTING_TYPE_NOT_IN_BITMAP errors filtered)', () => {
    const result = deriveDnsvizStatus(nemilGrok, 'nemil.xyz');
    expect(result.status).toBe('SECURE');
    expect(result.summary.delegationStatus).toBe('SECURE');
    expect(result.summary.parentChainStatuses['xyz.']).toBe('SECURE');
    expect(result.summary.parentChainStatuses['nemil.xyz.']).toBe('SECURE');
    expect(result.errorsCount).toBe(0);
  });

  it('returns INSECURE for namefi.dev with non-ignored errors counted', () => {
    const result = deriveDnsvizStatus(namefiDevGrok, 'namefi.dev');
    expect(result.status).toBe('INSECURE');
    expect(result.summary.delegationStatus).toBe('INSECURE');
    expect(result.summary.parentChainStatuses['dev.']).toBe('SECURE');
    expect(result.summary.parentChainStatuses['namefi.dev.']).toBe('INSECURE');
    // namefi.dev has 2 raw errors with code NONZERO_NSEC3_ITERATION_COUNT;
    // none are in the default ignored set so both are counted.
    expect(result.errorsCount).toBe(2);
    expect(result.summary.topErrors[0]).toMatch(/NSEC3/);
  });

  it('maps a dnssec-audit insecure delegation to INSECURE, not SECURE', () => {
    // dnssec-audit reports an insecure (no-DS) delegation as a step with
    // `ok: true` (the no-DS proof validated). The per-zone status must still
    // read INSECURE — keying off `ok` alone would mislabel it SECURE.
    const auditGrok = {
      result: {
        qname: 'unsigned.example.',
        qtype: 1,
        verdict: 'insecure',
        detail: 'insecure delegation at example.',
        steps: [
          { kind: 'ds', zone: 'example.', ok: true, detail: 'DS ok' },
          {
            kind: 'insecure',
            zone: 'unsigned.example.',
            ok: true,
            detail: 'no DS — delegation is insecure',
          },
        ],
      },
    };

    const result = deriveDnsvizStatus(auditGrok, 'unsigned.example');
    expect(result.status).toBe('INSECURE');
    expect(result.summary.parentChainStatuses['example.']).toBe('SECURE');
    expect(result.summary.parentChainStatuses['unsigned.example.']).toBe(
      'INSECURE',
    );
  });

  it('counts EXISTING_TYPE_NOT_IN_BITMAP when the filter is overridden to empty', () => {
    const result = deriveDnsvizStatus(samyxGrok, 'samyx.net', {
      ignoredErrorCodes: new Set(),
    });
    expect(result.status).toBe('SECURE');
    // With no filter, the raw EXISTING_TYPE_NOT_IN_BITMAP entries are counted.
    expect(result.errorsCount).toBeGreaterThan(0);
  });

  it('returns INSECURE when the leaf zone has no DS at parent', () => {
    const grok = {
      'example.com.': {
        status: 'NOERROR',
        delegation: { status: 'INSECURE' },
      },
    };
    const result = deriveDnsvizStatus(grok, 'example.com');
    expect(result.status).toBe('INSECURE');
    expect(result.summary.delegationStatus).toBe('INSECURE');
    expect(result.errorsCount).toBe(0);
  });

  it('returns BOGUS when delegation status is BOGUS and counts errors', () => {
    const grok = {
      'broken.example.': {
        status: 'NOERROR',
        delegation: {
          status: 'BOGUS',
          errors: [
            { description: 'DS digest does not match DNSKEY' },
            { description: 'RRSIG covering DNSKEY does not validate' },
          ],
        },
        queries: {
          'broken.example./IN/A': {
            answer: [
              {
                rrsig: [
                  {
                    status: 'INVALID_SIGNATURE',
                    errors: [{ description: 'signature inception in future' }],
                  },
                ],
              },
            ],
          },
        },
      },
    };
    const result = deriveDnsvizStatus(grok, 'broken.example');
    expect(result.status).toBe('BOGUS');
    expect(result.errorsCount).toBe(3);
    expect(result.summary.topErrors).toHaveLength(3);
    expect(result.summary.topErrors[0]).toBe('DS digest does not match DNSKEY');
  });

  it('caps topErrors / topWarnings at 3 entries', () => {
    const grok = {
      'noisy.example.': {
        status: 'NOERROR',
        delegation: {
          status: 'BOGUS',
          errors: [
            { description: 'a' },
            { description: 'b' },
            { description: 'c' },
            { description: 'd' },
            { description: 'e' },
          ],
          warnings: [
            { description: 'w1' },
            { description: 'w2' },
            { description: 'w3' },
            { description: 'w4' },
          ],
        },
      },
    };
    const result = deriveDnsvizStatus(grok, 'noisy.example');
    expect(result.errorsCount).toBe(5);
    expect(result.summary.topErrors).toEqual(['a', 'b', 'c']);
    expect(result.warningsCount).toBe(4);
    expect(result.summary.topWarnings).toEqual(['w1', 'w2', 'w3']);
  });

  it('returns ERROR when grok is not an object', () => {
    const result = deriveDnsvizStatus('not json', 'example.com');
    expect(result.status).toBe('ERROR');
    expect(result.summary.topErrors[0]).toMatch(/not an object/i);
  });

  it('returns ERROR when no zone matches the requested domain', () => {
    const grok = {
      '.': { status: 'NOERROR' },
      'com.': { status: 'NOERROR', delegation: { status: 'SECURE' } },
    };
    const result = deriveDnsvizStatus(grok, 'unmatched.example');
    expect(result.status).toBe('ERROR');
    expect(result.summary.topErrors[0]).toMatch(/no zone matches/i);
  });

  it('matches case-insensitively (mixed-case domain input)', () => {
    const result = deriveDnsvizStatus(samyxGrok, 'SAMYX.NET');
    expect(result.status).toBe('SECURE');
  });

  it('falls back to a suffix-matching zone when leaf is missing', () => {
    const grok = {
      'parent.example.': {
        status: 'NOERROR',
        delegation: { status: 'SECURE' },
      },
    };
    // Asking for a subdomain that wasn't probed directly; falls back to
    // the deepest matching zone. (Logged as a soft fall-back by the caller.)
    const result = deriveDnsvizStatus(grok, 'sub.parent.example');
    expect(result.status).toBe('SECURE');
    expect(result.summary.delegationStatus).toBe('SECURE');
  });

  it('does not match a non-suffix zone (xexample.com vs example.com)', () => {
    const grok = {
      'xexample.com.': {
        status: 'NOERROR',
        delegation: { status: 'SECURE' },
      },
    };
    const result = deriveDnsvizStatus(grok, 'example.com');
    expect(result.status).toBe('ERROR');
  });
});
