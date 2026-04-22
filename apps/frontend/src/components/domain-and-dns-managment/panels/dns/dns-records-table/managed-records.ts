import type { DnsRecordSelect } from '@namefi-astra/common/contract/entity-schemas';

const MANAGED_BY_VALUES = ['autoPark', 'forwarding', 'autoEns'] as const;

type ManagedBy = (typeof MANAGED_BY_VALUES)[number];

export type ManagedDnsRecordPatch = {
  autoParkEnabled?: boolean;
  autoEnsEnabled?: boolean;
  forwardTo?: string;
};

export type ManagedDnsRecordMetadata = {
  namefiManaged: true;
  managedBy: ManagedBy;
  disablePatch: ManagedDnsRecordPatch;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isManagedBy(value: unknown): value is ManagedBy {
  return (
    typeof value === 'string' && MANAGED_BY_VALUES.includes(value as ManagedBy)
  );
}

function isManagedDnsRecordPatch(
  value: unknown,
): value is ManagedDnsRecordPatch {
  if (!isObject(value)) {
    return false;
  }

  const { autoParkEnabled, autoEnsEnabled, forwardTo } = value;
  const autoParkValid =
    autoParkEnabled === undefined || typeof autoParkEnabled === 'boolean';
  const autoEnsValid =
    autoEnsEnabled === undefined || typeof autoEnsEnabled === 'boolean';
  const forwardToValid =
    forwardTo === undefined || typeof forwardTo === 'string';

  return autoParkValid && autoEnsValid && forwardToValid;
}

export function getManagedDnsRecordMetadata(
  record: Pick<DnsRecordSelect, 'metadata'>,
): ManagedDnsRecordMetadata | null {
  if (!isObject(record.metadata)) {
    return null;
  }

  const namefiManaged = record.metadata.namefiManaged;
  const managedBy = record.metadata.managedBy;
  const disablePatch = record.metadata.disablePatch;

  if (namefiManaged !== true || !isManagedBy(managedBy)) {
    return null;
  }

  if (!isManagedDnsRecordPatch(disablePatch)) {
    return null;
  }

  return {
    namefiManaged: true,
    managedBy,
    disablePatch,
  };
}

export function isManagedDnsRecord(record: Pick<DnsRecordSelect, 'metadata'>) {
  return getManagedDnsRecordMetadata(record) !== null;
}

export function getManagedRecordDisablePatch(
  record: Pick<DnsRecordSelect, 'metadata'>,
) {
  return getManagedDnsRecordMetadata(record)?.disablePatch ?? null;
}

export function getManagedRecordLabel(
  record: Pick<DnsRecordSelect, 'metadata'>,
) {
  const metadata = getManagedDnsRecordMetadata(record);
  if (!metadata) {
    return null;
  }
  if (metadata.managedBy === 'autoPark') {
    return 'Parking';
  }
  if (metadata.managedBy === 'autoEns') {
    return 'AutoENS';
  }
  return 'Forwarding';
}
