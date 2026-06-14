import {
  type DnsRecordSelect,
  db,
  domainConfigTable,
  namefiNftOwnersCte,
  namefiNftOwnersView,
} from '@namefi-astra/db';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { RecordType, type recordSchema } from '@namefi-astra/zod-dns';
import { eq } from 'drizzle-orm';
import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { config } from '#lib/env';
import {
  formatGateTxtRdata,
  getOrIssueGateToken,
  isParkGateEnabled,
} from './park-gate/issuer';

export const MANAGED_DNS_PARKING_CONFLICT_CODE = 'DNS_PARKING_CONFLICT';
export const MANAGED_DNS_CNAME_CONFLICT_CODE = 'DNS_CNAME_CONFLICT';
export const MANAGED_DNS_CNAME_MANAGED_CONFLICT_CODE =
  'DNS_CNAME_MANAGED_CONFLICT';
export const FORWARDING_TXT_PREFIX = '--nfi-redirect=';
export const ENS_TXT_PREFIX = 'ENS1 dnsname.ens.eth';

export type ManagedDnsRecordPatch = {
  autoParkEnabled?: boolean;
  autoEnsEnabled?: boolean;
  forwardTo?: string;
};

export type ManagedDnsRecordMetadata = {
  namefiManaged: true;
  managedBy: 'autoPark' | 'forwarding' | 'autoEns' | 'parkGate';
  disablePatch: ManagedDnsRecordPatch;
};

export type ManagedDnsState = {
  autoEnsEnabled: boolean;
  autoParkEnabled: boolean;
  forwardTo: string | null;
  ownerAddress: string | null;
  shouldServeParkingRecords: boolean;
};

const SYNTHETIC_TIMESTAMP = new Date(0);

export const PARKED_DOMAIN_RECORDS: z.infer<typeof recordSchema>[] = [
  {
    type: RecordType.A,
    name: '@',
    rdata: '24.199.74.33',
    ttl: 60,
  },
  {
    type: RecordType.AAAA,
    name: '@',
    rdata: '2604:a880:4:1d0::417:7000',
    ttl: 60,
  },
  {
    type: RecordType.CAA,
    name: '@',
    rdata: '0 issue "letsencrypt.org"',
    ttl: 60,
  },
  {
    type: RecordType.CAA,
    name: '@',
    rdata: '0 issue "zerossl.com"',
    ttl: 60,
  },
];

function normalizeForwardTo(
  forwardTo: string | undefined | null,
): string | null {
  const trimmed = forwardTo?.trim();
  return trimmed ? trimmed : null;
}

function deterministicUuidFromKey(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex').slice(0, 32);
  const bytes = hash.split('');
  bytes[12] = '4';
  bytes[16] = ((Number.parseInt(bytes[16], 16) & 0x3) | 0x8).toString(16);
  const hex = bytes.join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20, 32)}`;
}

function createManagedRecord(
  zoneName: NamefiNormalizedDomain,
  record: z.infer<typeof recordSchema>,
  metadata: ManagedDnsRecordMetadata,
): DnsRecordSelect {
  const key = [
    zoneName,
    record.name,
    record.type,
    record.rdata,
    record.ttl,
    metadata.managedBy,
  ].join('|');

  return {
    id: deterministicUuidFromKey(key),
    zoneName,
    type: record.type,
    name: record.name,
    class: 'IN',
    ttl: record.ttl,
    rdata: record.rdata,
    metadata,
    createdAt: new Date(SYNTHETIC_TIMESTAMP),
    updatedAt: new Date(SYNTHETIC_TIMESTAMP),
  };
}

export function buildManagedRecordsForState(
  zoneName: NamefiNormalizedDomain,
  state: Pick<
    ManagedDnsState,
    'autoEnsEnabled' | 'autoParkEnabled' | 'forwardTo' | 'ownerAddress'
  >,
) {
  const forwardTo = normalizeForwardTo(state.forwardTo);
  const shouldServeParkingRecords = state.autoParkEnabled || forwardTo !== null;
  const records: DnsRecordSelect[] = [];

  if (shouldServeParkingRecords) {
    records.push(
      ...PARKED_DOMAIN_RECORDS.map((record) =>
        createManagedRecord(zoneName, record, {
          namefiManaged: true,
          managedBy: 'autoPark',
          disablePatch: { autoParkEnabled: false, forwardTo: '' },
        }),
      ),
    );
  }

  if (state.autoEnsEnabled && state.ownerAddress) {
    records.push(
      createManagedRecord(
        zoneName,
        {
          type: RecordType.TXT,
          name: '@',
          ttl: 60,
          rdata: `"${ENS_TXT_PREFIX} ${state.ownerAddress}"`,
        },
        {
          namefiManaged: true,
          managedBy: 'autoEns',
          disablePatch: { autoEnsEnabled: false },
        },
      ),
    );
  }

  if (forwardTo) {
    records.push(
      createManagedRecord(
        zoneName,
        {
          type: RecordType.TXT,
          name: '@',
          ttl: 60,
          rdata: `"${FORWARDING_TXT_PREFIX}${forwardTo}"`,
        },
        {
          namefiManaged: true,
          managedBy: 'forwarding',
          disablePatch: { forwardTo: '' },
        },
      ),
    );
  }

  return records;
}

export async function getDomainManagedDnsState(
  zoneName: NamefiNormalizedDomain,
): Promise<ManagedDnsState> {
  const [domainConfig, ownerResult] = await Promise.all([
    db.query.domainConfigTable.findFirst({
      where: eq(domainConfigTable.normalizedDomainName, zoneName),
    }),
    db
      .with(namefiNftOwnersCte)
      .select({
        ownerAddress: namefiNftOwnersView.ownerAddress,
      })
      .from(namefiNftOwnersView)
      .where(eq(namefiNftOwnersView.normalizedDomainName, zoneName))
      .limit(1),
  ]);

  const forwardTo = normalizeForwardTo(domainConfig?.forwardTo);
  const autoParkEnabled = domainConfig?.autoParkEnabled ?? true;
  const autoEnsEnabled = domainConfig?.autoEnsEnabled ?? false;

  return {
    autoEnsEnabled,
    autoParkEnabled,
    forwardTo,
    ownerAddress: ownerResult[0]?.ownerAddress ?? null,
    shouldServeParkingRecords: autoParkEnabled || forwardTo !== null,
  };
}

/**
 * Build the park-gate TXT record (`<label>.<zone>`) carrying the signed
 * authorization JWT. Returns `null` when the gate is disabled or the zone is
 * not currently serving parking records. The token is Redis-cached by the
 * issuer, so this re-signs at most once per cache window.
 */
async function buildParkGateManagedRecord(
  zoneName: NamefiNormalizedDomain,
  state: Pick<ManagedDnsState, 'shouldServeParkingRecords'>,
): Promise<DnsRecordSelect | null> {
  if (!isParkGateEnabled() || !state.shouldServeParkingRecords) {
    return null;
  }

  const token = await getOrIssueGateToken(zoneName);
  if (!token) {
    return null;
  }

  return createManagedRecord(
    zoneName,
    {
      type: RecordType.TXT,
      name: config.NAMEFI_PARK_GATE_LABEL,
      ttl: config.NAMEFI_PARK_GATE_RECORD_TTL_SECONDS,
      rdata: formatGateTxtRdata(token),
    },
    {
      namefiManaged: true,
      managedBy: 'parkGate',
      disablePatch: { autoParkEnabled: false, forwardTo: '' },
    },
  );
}

export async function getManagedRecordsForZone(
  zoneName: NamefiNormalizedDomain,
) {
  const state = await getDomainManagedDnsState(zoneName);
  const records = buildManagedRecordsForState(zoneName, state);

  const gateRecord = await buildParkGateManagedRecord(zoneName, state);
  if (gateRecord) {
    records.push(gateRecord);
  }

  return records;
}
