import type { recordSchema } from '@namefi-astra/zod-dns';
import type { z } from 'zod';
/**
 * Helper function to check if two records are equal
 * @param record1 - The first record
 * @param record2 - The second record
 * @returns True if the records are equal, false otherwise
 */
// TODO: delete or remove 'export', not being used by trpc or temporal.
export function areRecordsEqual(
  record1: z.infer<typeof recordSchema>,
  record2: z.infer<typeof recordSchema>,
) {
  return (
    record1.type === record2.type &&
    record1.name === record2.name &&
    record1.rdata === record2.rdata &&
    record1.ttl === record2.ttl
  );
}

/**
 * Helper function to check if two records are in the same record set
 * @param record1 - The first record
 * @param record2 - The second record
 * @returns True if the records are in the same record set, false otherwise
 */
// TODO: delete or remove 'export', not being used by trpc or temporal.
export function areRecordsInSameSet(
  record1: z.infer<typeof recordSchema>,
  record2: z.infer<typeof recordSchema>,
) {
  return (
    record1.type === record2.type &&
    record1.name === record2.name &&
    record1.ttl === record2.ttl
  );
}
