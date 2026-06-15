import {
  type DnsRecordSelect,
  db,
  dnsRecordInsertSchema,
  dnsRecordsTable,
} from '@namefi-astra/db';
import {
  type NamefiNormalizedDomain,
  namefiNormalizedDomainSchema,
} from '@namefi-astra/utils';
import {
  recordSchema,
  recordTypeEnum,
  zoneSchema,
} from '@namefi-astra/zod-dns';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  assoc,
  filter,
  isNotNil,
  map,
  mergeRight,
  pickBy,
  pluck,
  omit,
} from 'ramda';
import { z } from 'zod';
import { areRecordsEqual } from './helpers';
import {
  MANAGED_DNS_CNAME_CONFLICT_CODE,
  MANAGED_DNS_CNAME_MANAGED_CONFLICT_CODE,
  MANAGED_DNS_PARKING_CONFLICT_CODE,
  type ManagedDnsState,
  PARKED_DOMAIN_RECORDS,
  buildManagedRecordsForState,
  getDomainManagedDnsState,
  getManagedRecordsForZone,
} from './managed-records';

/**
 * Structurally identical copies of these schemas live in
 * `@namefi-astra/common/dns-records-contract` for the DNS records router
 * contract. The two definitions are deliberately independent (no
 * import-export cycle), and divergence is caught at compile time by the
 * contract assignment in `dnsRecordsRouter.ts`.
 */
export const updateRecordInputSchema = z.object({
  id: z.string(),
  zoneName: namefiNormalizedDomainSchema,
  type: recordTypeEnum.optional(),
  name: z.string().optional(),
  rdata: z.string().optional(),
  ttl: z.number().optional(),
});

export const createRecordInputSchema = dnsRecordInsertSchema.pick({
  type: true,
  name: true,
  rdata: true,
  ttl: true,
  zoneName: true,
});

type ZoneRecordLike = {
  name: string;
  type: string;
  rdata: string;
  ttl: number;
  class?: string;
};

type ValidateZoneManagedStateOverride = Partial<
  Pick<
    ManagedDnsState,
    'autoEnsEnabled' | 'autoParkEnabled' | 'forwardTo' | 'ownerAddress'
  >
>;

type ZoneChanges = {
  addedRecords?: z.infer<typeof recordSchema>[];
  updatedRecords?: Omit<z.infer<typeof updateRecordInputSchema>, 'zoneName'>[];
  deletedRecords?: (z.infer<typeof recordSchema> & { id?: string })[];
};

function getRecordSetKey(record: ZoneRecordLike) {
  return [
    record.name,
    record.type,
    record.rdata,
    record.ttl,
    record.class ?? 'IN',
  ].join('|');
}

function dedupeRecordsBySet<T extends ZoneRecordLike>(records: T[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = getRecordSetKey(record);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function isApexName(name: string) {
  return name === '@' || name === '';
}

function isApexParkingConflictCandidate(record: z.infer<typeof recordSchema>) {
  if (!isApexName(record.name)) {
    return false;
  }
  return record.type === 'A' || record.type === 'AAAA';
}

function isParkedApexRecord(record: z.infer<typeof recordSchema>) {
  return PARKED_DOMAIN_RECORDS.some((parkedRecord) =>
    areRecordsEqual(parkedRecord, record),
  );
}

function normalizeRecordName(name: string) {
  return name.trim().toLowerCase();
}

function getManagedStateWithOverride(
  managedState: ManagedDnsState,
  override?: ValidateZoneManagedStateOverride,
): ManagedDnsState {
  const forwardTo =
    override && 'forwardTo' in override
      ? (override.forwardTo ?? null)
      : managedState.forwardTo;
  const ownerAddress =
    override && 'ownerAddress' in override
      ? (override.ownerAddress ?? null)
      : managedState.ownerAddress;

  return {
    autoEnsEnabled: override?.autoEnsEnabled ?? managedState.autoEnsEnabled,
    autoParkEnabled: override?.autoParkEnabled ?? managedState.autoParkEnabled,
    forwardTo,
    ownerAddress,
    shouldServeParkingRecords:
      (override?.autoParkEnabled ?? managedState.autoParkEnabled) ||
      forwardTo !== null,
  };
}

function applyRecordChanges(
  existingRecords: Awaited<ReturnType<typeof getZoneRecords>>,
  updatedRecords: NonNullable<ZoneChanges['updatedRecords']>,
  deletedRecords: NonNullable<ZoneChanges['deletedRecords']>,
) {
  const updatedExistingRecords = filter(
    isNotNil,
    existingRecords.map((record) => {
      const update = updatedRecords.find(
        (candidate) => candidate.id === record.id,
      );
      if (update) {
        return mergeRight(record, update);
      }
      if (
        deletedRecords.find(
          (deletedRecord) =>
            deletedRecord.id === record.id ||
            areRecordsEqual(deletedRecord, record),
        )
      ) {
        return null;
      }
      return record;
    }),
  );

  const updatedChangedRecords = filter(
    isNotNil,
    updatedRecords.map((update) => {
      const existingRecord = existingRecords.find(
        (record) => record.id === update.id,
      );
      if (!existingRecord) {
        return null;
      }
      const merged = mergeRight(existingRecord, update);
      return {
        type: merged.type,
        name: merged.name,
        rdata: merged.rdata,
        ttl: merged.ttl,
      } satisfies z.infer<typeof recordSchema>;
    }),
  );

  return {
    updatedExistingRecords,
    updatedChangedRecords,
  };
}

function assertNoCnameConflicts(
  addedRecords: z.infer<typeof recordSchema>[],
  updatedChangedRecords: z.infer<typeof recordSchema>[],
  updatedExistingRecords: Awaited<ReturnType<typeof getZoneRecords>>,
  managedRecords: ReturnType<typeof buildManagedRecordsForState>,
) {
  const cnameCandidates = [...addedRecords, ...updatedChangedRecords].filter(
    (record) => record.type === 'CNAME',
  );

  if (cnameCandidates.length === 0) {
    return;
  }

  const nonManagedNonCnameRecords = [
    ...updatedExistingRecords,
    ...addedRecords,
  ].filter((record) => record.type !== 'CNAME');
  const managedNonCnameRecords = managedRecords.filter(
    (record) => record.type !== 'CNAME',
  );

  const hasNonManagedConflict = cnameCandidates.some((cnameCandidate) => {
    const cnameName = normalizeRecordName(cnameCandidate.name);
    return nonManagedNonCnameRecords.some(
      (record) => normalizeRecordName(record.name) === cnameName,
    );
  });

  if (hasNonManagedConflict) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${MANAGED_DNS_CNAME_CONFLICT_CODE}: CNAME records cannot share a name with other record types. Delete conflicting records first.`,
    });
  }

  const hasManagedOnlyConflict = cnameCandidates.some((cnameCandidate) => {
    const cnameName = normalizeRecordName(cnameCandidate.name);
    return managedNonCnameRecords.some(
      (record) => normalizeRecordName(record.name) === cnameName,
    );
  });

  if (hasManagedOnlyConflict) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${MANAGED_DNS_CNAME_MANAGED_CONFLICT_CODE}: Disable managed records before adding this CNAME.`,
    });
  }
}

function assertNoParkingConflicts(
  records: z.infer<typeof recordSchema>[],
  shouldServeParkingRecords: boolean,
) {
  if (!shouldServeParkingRecords) {
    return;
  }

  const parkingConflict = records.some((record) => {
    if (!isApexParkingConflictCandidate(record)) {
      return false;
    }
    return !isParkedApexRecord(record);
  });

  if (parkingConflict) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `${MANAGED_DNS_PARKING_CONFLICT_CODE}: Disable parking and forwarding before adding apex A/AAAA records.`,
    });
  }
}

/**
 * Helper function to get a DNS record by ID and domain name.
 * Throws if the record doesn't exist or doesn't belong to the specified domain.
 * @param id - The ID of the DNS record to find
 * @param zoneName - The normalized domain name to check against
 * @returns The found DNS record
 * @throws {TRPCError} If record is not found or doesn't belong to Domain
 */
export async function getRecordByIdAndDomainOrThrow(
  id: string,
  zoneName: NamefiNormalizedDomain,
) {
  const record = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(eq(dnsRecordsTable.id, id), eq(dnsRecordsTable.zoneName, zoneName)),
    );

  if (record?.length === 0) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'DNS record not found or does not belong to this domain',
    });
  }

  return record[0];
}

/**
 * Helper function to get all DNS records for a given domain
 * @param zoneName - The normalized domain name to get records for
 * @returns An array of DNS records for the domain
 */
export async function getZoneRecords(zoneName: NamefiNormalizedDomain) {
  const records = await db
    .select()
    .from(dnsRecordsTable)
    .where(eq(dnsRecordsTable.zoneName, zoneName));

  return records;
}

export async function getZoneRecordsWithManagedRecords(
  zoneName: NamefiNormalizedDomain,
) {
  const [zoneRecords, managedRecords] = await Promise.all([
    getZoneRecords(zoneName),
    getManagedRecordsForZone(zoneName),
  ]);

  return dedupeRecordsBySet<DnsRecordSelect>([
    ...managedRecords,
    ...zoneRecords,
  ]);
}

/**
 * Helper function to validate a DNS zone with existing, updated, and new records
 * @param zoneName - The normalized domain name to validate zone for
 * @param addRecords - Array of new DNS records to add to the zone
 * @param updatedRecord - Array of existing records with updates to apply
 * @param deleteRecords - Array of existing records to delete
 * @returns Array of all records in the zone after updates
 */
export async function validateZone(
  zoneName: NamefiNormalizedDomain,
  changes: ZoneChanges,
  options?: {
    managedStateOverride?: ValidateZoneManagedStateOverride;
  },
) {
  const {
    addedRecords = [],
    updatedRecords = [],
    deletedRecords = [],
  } = changes;
  const [existingRecords, managedState] = await Promise.all([
    getZoneRecords(zoneName),
    getDomainManagedDnsState(zoneName),
  ]);

  const { updatedExistingRecords, updatedChangedRecords } = applyRecordChanges(
    existingRecords,
    updatedRecords,
    deletedRecords,
  );
  const nextManagedState = getManagedStateWithOverride(
    managedState,
    options?.managedStateOverride,
  );

  const managedRecords = buildManagedRecordsForState(
    zoneName,
    nextManagedState,
  );

  // Combine existing (with updates), new records, and managed records.
  const allRecords = dedupeRecordsBySet([
    ...updatedExistingRecords.map((record) => {
      return {
        type: record.type,
        name: record.name,
        rdata: record.rdata,
        ttl: record.ttl,
      };
    }),
    ...addedRecords,
    ...managedRecords.map((record) => ({
      type: record.type,
      name: record.name,
      rdata: record.rdata,
      ttl: record.ttl,
    })),
  ]);

  assertNoCnameConflicts(
    addedRecords,
    updatedChangedRecords,
    updatedExistingRecords,
    managedRecords,
  );
  assertNoParkingConflicts(
    [...addedRecords, ...updatedChangedRecords],
    nextManagedState.shouldServeParkingRecords,
  );

  // Validate the entire zone
  await zoneSchema.parseAsync({
    zoneName: zoneName,
    records: allRecords,
  });
}

/**
 * Helper function to update a DNS record by ID
 * @param input - The input data for the updated record
 * @returns The updated DNS record
 */
export async function updateRecord(
  input: z.infer<typeof updateRecordInputSchema>,
) {
  const { id, zoneName, ...updateData } = input;

  // First, verify the record exists and belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, zoneName);

  // Validate the zone with the updated record
  await validateZone(zoneName, {
    updatedRecords: [input],
  });

  // Update the record in the database
  const updatedRecord = await db
    .update(dnsRecordsTable)
    .set(pickBy(isNotNil, updateData))
    .where(
      and(eq(dnsRecordsTable.id, id), eq(dnsRecordsTable.zoneName, zoneName)),
    )
    .returning();

  return updatedRecord[0];
}

/**
 * Helper function to delete a DNS record by ID
 * @param id - The ID of the DNS record to delete
 * @param zoneName - The normalized domain name to check against
 */
export async function deleteRecord(
  id: string,
  zoneName: NamefiNormalizedDomain,
) {
  // First, verify the record belongs to the specified domain
  await getRecordByIdAndDomainOrThrow(id, zoneName);

  // Delete the record
  await db.delete(dnsRecordsTable).where(eq(dnsRecordsTable.id, id));
}

/**
 * Helper function to create a new DNS record
 * @param input - The input data for the new record
 * @returns The created DNS record
 */
export async function createRecord(
  input: z.infer<typeof createRecordInputSchema>,
) {
  const parsedRecord = recordSchema.parse({
    type: input.type,
    name: input.name,
    rdata: input.rdata,
    ttl: input.ttl,
  });

  // Validate the zone with the new record
  await validateZone(input.zoneName, {
    addedRecords: [parsedRecord],
  });

  const record = await db.insert(dnsRecordsTable).values(input).returning();
  return record[0];
}

export async function batchUpdateRecords(
  zoneName: NamefiNormalizedDomain,
  records: Omit<z.infer<typeof updateRecordInputSchema>, 'zoneName'>[],
) {
  if (records.length === 0) {
    return [];
  }

  const existingRecords = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(
        inArray(dnsRecordsTable.id, pluck('id', records)),
        eq(dnsRecordsTable.zoneName, zoneName),
      ),
    );

  if (existingRecords?.length !== records.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Some DNS records are not found or do not belong to this domain',
    });
  }

  await validateZone(zoneName, {
    updatedRecords: records,
  });

  const updatedRecords = await db.transaction(async (tx) => {
    const rows: Array<typeof dnsRecordsTable.$inferSelect> = [];
    for (const record of records) {
      const updated = await tx
        .update(dnsRecordsTable)
        .set(pickBy(isNotNil, omit(['id'], record)))
        .where(
          and(
            eq(dnsRecordsTable.id, record.id),
            eq(dnsRecordsTable.zoneName, zoneName),
          ),
        )
        .returning();
      rows.push(...updated);
    }
    return rows;
  });

  return updatedRecords;
}

//TODO: validate that returning is working properly with multi-statement sql
export async function batchUpdateRecordsV2(
  zoneName: NamefiNormalizedDomain,
  records: Omit<z.infer<typeof updateRecordInputSchema>, 'zoneName'>[],
) {
  if (records.length === 0) {
    return [];
  }

  const existingRecords = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(
        inArray(dnsRecordsTable.id, pluck('id', records)),
        eq(dnsRecordsTable.zoneName, zoneName),
      ),
    );

  if (existingRecords?.length !== records.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Some DNS records are not found or do not belong to this domain',
    });
  }

  await validateZone(zoneName, {
    updatedRecords: records,
  });

  const updatedRecords = await db.transaction(async (tx) => {
    const multiStatementSql = sql.join(
      records.map((record) =>
        tx
          .update(dnsRecordsTable)
          .set(pickBy(isNotNil, omit(['id'], record)))
          .where(
            and(
              eq(dnsRecordsTable.id, record.id),
              eq(dnsRecordsTable.zoneName, zoneName),
            ),
          )
          .returning()
          .getSQL(),
      ),
      sql`;\n`,
    );
    return tx.execute(multiStatementSql.inlineParams());
  });

  return updatedRecords;
}

export async function batchCreateRecords(
  zoneName: NamefiNormalizedDomain,
  records: z.infer<typeof recordSchema>[],
) {
  if (records.length === 0) {
    return [];
  }
  await validateZone(zoneName, {
    addedRecords: records,
  });

  const addedRecords = await db
    .insert(dnsRecordsTable)
    .values(map(assoc('zoneName', zoneName), records))
    .returning();
  return addedRecords;
}

export async function batchDeleteRecords(
  zoneName: NamefiNormalizedDomain,
  recordIds: string[],
) {
  if (recordIds.length === 0) {
    return { success: true as const };
  }

  const records = await db
    .select()
    .from(dnsRecordsTable)
    .where(
      and(
        inArray(dnsRecordsTable.id, recordIds),
        eq(dnsRecordsTable.zoneName, zoneName),
      ),
    );

  if (records?.length !== recordIds.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Some DNS records are not found or do not belong to this domain',
    });
  }

  await validateZone(zoneName, {
    deletedRecords: records,
  });

  await db
    .delete(dnsRecordsTable)
    .where(
      and(
        eq(dnsRecordsTable.zoneName, zoneName),
        inArray(dnsRecordsTable.id, recordIds),
      ),
    );

  return { success: true as const };
}
