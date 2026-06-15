import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { describe, expect, it } from 'vitest';
import {
  ENS_TXT_PREFIX,
  FORWARDING_TXT_PREFIX,
  buildManagedRecordsForState,
} from './managed-records';

const zoneName = 'example.com' as NamefiNormalizedDomain;

describe('buildManagedRecordsForState', () => {
  it('builds parking records when autoPark is enabled', () => {
    const records = buildManagedRecordsForState(zoneName, {
      autoParkEnabled: true,
      autoEnsEnabled: false,
      forwardTo: null,
      ownerAddress: null,
    });

    expect(records).toHaveLength(4);
    expect(records.map((record) => record.type)).toEqual([
      'A',
      'AAAA',
      'CAA',
      'CAA',
    ]);
    expect(
      records.every((record) => record.metadata?.namefiManaged === true),
    ).toBe(true);
  });

  it('builds parking + forwarding records when forwarding is configured', () => {
    const records = buildManagedRecordsForState(zoneName, {
      autoParkEnabled: false,
      autoEnsEnabled: false,
      forwardTo: 'https://namefi.io',
      ownerAddress: null,
    });

    expect(records).toHaveLength(5);
    expect(records.some((record) => record.type === 'TXT')).toBe(true);
    expect(
      records.some(
        (record) =>
          record.type === 'TXT' &&
          record.rdata === `"${FORWARDING_TXT_PREFIX}https://namefi.io"`,
      ),
    ).toBe(true);
  });

  it('builds autoENS TXT record only when owner is available', () => {
    const records = buildManagedRecordsForState(zoneName, {
      autoParkEnabled: false,
      autoEnsEnabled: true,
      forwardTo: null,
      ownerAddress: '0x1234',
    });

    expect(records).toHaveLength(1);
    expect(records[0].type).toBe('TXT');
    expect(records[0].rdata).toBe(`"${ENS_TXT_PREFIX} 0x1234"`);
    expect(records[0].metadata).toMatchObject({
      namefiManaged: true,
      managedBy: 'autoEns',
      disablePatch: { autoEnsEnabled: false },
    });
  });
});
