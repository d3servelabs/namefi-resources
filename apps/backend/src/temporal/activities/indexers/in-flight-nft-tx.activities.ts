/**
 * Activities for the optimistic in-flight NFT transaction overlay
 * ({@link inFlightNftTxTable}). These manage the lifecycle of an optimistic row
 * that represents a deferred, non-blocking on-chain NFT operation (mint /
 * expiration change / lock change) so the app can show "Minting… / Updating
 * expiration… / Updating lock…" before the Ponder indexer reflects the change.
 *
 * Lifecycle: insert (PENDING) -> op runs -> mark CONFIRMED or FAILED -> removed
 * by event-driven reconciliation (real state caught up), the per-op timer, or
 * the scheduled TTL sweep.
 */

import {
  db,
  inFlightNftSupersededExpr,
  nftIndexSchema,
} from '@namefi-astra/db';
import {
  inFlightNftTxTable,
  managedNamefiNftTable,
  type InFlightNftChangeType,
} from '@namefi-astra/db/schemas/managed-indexer-data';
import { getTokenIdFromDomainName } from '@namefi-astra/utils';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { and, eq, sql } from 'drizzle-orm';
import { addDays } from 'date-fns';
import { createLogger } from '#lib/logger';

const logger = createLogger({ name: 'in-flight-nft-tx-activities' });

/**
 * How long an optimistic row lives before the TTL sweep purges it. A backstop
 * for ops that never confirm or never get reconciled (stuck tx, indexer down).
 */
export const IN_FLIGHT_NFT_TX_TTL_DAYS = 2;

const DEFAULT_SWEEP_BATCH_SIZE = 500;

export type InsertInFlightNftTxRowInput = {
  changeType: InFlightNftChangeType;
  chainId: number;
  normalizedDomainName: NamefiNormalizedDomain;
  /** Set by MINTING only (the base owner of the new NFT). */
  ownerAddress?: string | null;
  /** Set by MINTING + CHANGING_EXPIRATION. */
  expirationTimeInSeconds?: number | null;
  /** Set by MINTING (false) + CHANGING_LOCK. */
  isLocked?: boolean | null;
  /** Owning workflow id (idempotency key together with changeType). */
  workflowId: string;
  runId?: string | null;
};

/**
 * Insert an optimistic in-flight row for a deferred NFT operation. Idempotent on
 * `(workflowId, changeType)` among PENDING rows (safe across Temporal retries /
 * replays): a duplicate insert is a no-op and the existing row's id is returned.
 */
export async function insertInFlightNftTxRow(
  input: InsertInFlightNftTxRowInput,
): Promise<{ id: string }> {
  const tokenId = getTokenIdFromDomainName(input.normalizedDomainName);
  if (!tokenId) {
    throw new Error(
      `Failed to derive tokenId for domain "${input.normalizedDomainName}"`,
    );
  }

  const expiresAt = addDays(new Date(), IN_FLIGHT_NFT_TX_TTL_DAYS);

  const [inserted] = await db
    .insert(inFlightNftTxTable)
    .values({
      chainId: input.chainId,
      normalizedDomainName: input.normalizedDomainName,
      tokenId,
      changeType: input.changeType,
      ownerAddress: input.ownerAddress ?? null,
      expirationTimeInSeconds:
        input.expirationTimeInSeconds == null
          ? null
          : String(input.expirationTimeInSeconds),
      isLocked: input.isLocked ?? null,
      status: 'PENDING',
      workflowId: input.workflowId,
      runId: input.runId ?? null,
      expiresAt,
    })
    .onConflictDoNothing({
      target: [inFlightNftTxTable.workflowId, inFlightNftTxTable.changeType],
      where: sql`status = 'PENDING'`,
    })
    .returning({ id: inFlightNftTxTable.id });

  if (inserted) {
    logger.debug(
      { id: inserted.id, ...input },
      'Inserted in-flight NFT tx row (%s) for %s',
      input.changeType,
      input.normalizedDomainName,
    );
    return { id: inserted.id };
  }

  // Conflict: a PENDING row already exists for this (workflowId, changeType).
  const [existing] = await db
    .select({ id: inFlightNftTxTable.id })
    .from(inFlightNftTxTable)
    .where(
      and(
        eq(inFlightNftTxTable.workflowId, input.workflowId),
        eq(inFlightNftTxTable.changeType, input.changeType),
        eq(inFlightNftTxTable.status, 'PENDING'),
      ),
    )
    .limit(1);

  if (!existing) {
    // The row resolved between insert + select. Retry WITH the conflict guard so
    // a concurrent writer recreating the PENDING row can't trip the unique
    // constraint, then re-read to stay idempotent under races.
    const [retry] = await db
      .insert(inFlightNftTxTable)
      .values({
        chainId: input.chainId,
        normalizedDomainName: input.normalizedDomainName,
        tokenId,
        changeType: input.changeType,
        ownerAddress: input.ownerAddress ?? null,
        expirationTimeInSeconds:
          input.expirationTimeInSeconds == null
            ? null
            : String(input.expirationTimeInSeconds),
        isLocked: input.isLocked ?? null,
        status: 'PENDING',
        workflowId: input.workflowId,
        runId: input.runId ?? null,
        expiresAt,
      })
      .onConflictDoNothing({
        target: [inFlightNftTxTable.workflowId, inFlightNftTxTable.changeType],
        where: sql`status = 'PENDING'`,
      })
      .returning({ id: inFlightNftTxTable.id });

    if (retry) {
      return { id: retry.id };
    }

    const [finalExisting] = await db
      .select({ id: inFlightNftTxTable.id })
      .from(inFlightNftTxTable)
      .where(
        and(
          eq(inFlightNftTxTable.workflowId, input.workflowId),
          eq(inFlightNftTxTable.changeType, input.changeType),
          eq(inFlightNftTxTable.status, 'PENDING'),
        ),
      )
      .limit(1);

    if (!finalExisting) {
      throw new Error('Failed to establish idempotent in-flight NFT tx row');
    }
    return { id: finalExisting.id };
  }

  return { id: existing.id };
}

/**
 * Mark an in-flight row CONFIRMED and record its real tx hash. The row stays in
 * the overlay (CONFIRMED is still shown) until reconciliation or the TTL sweep
 * removes it, so the domain does not flicker between confirm and indexer sync.
 */
export async function markInFlightNftTxConfirmed({
  id,
  txHash,
}: {
  id: string;
  txHash: string;
}): Promise<void> {
  await db
    .update(inFlightNftTxTable)
    .set({ status: 'CONFIRMED', txHash })
    .where(eq(inFlightNftTxTable.id, id));
  logger.debug({ id, txHash }, 'Marked in-flight NFT tx row %s CONFIRMED', id);
}

/**
 * Mark an in-flight row FAILED so it drops out of the overlay immediately (a
 * failed deferred op must not keep showing optimistic state). The TTL sweep
 * eventually purges it.
 */
export async function markInFlightNftTxFailed({
  id,
  error,
}: {
  id: string;
  error?: string;
}): Promise<void> {
  await db
    .update(inFlightNftTxTable)
    .set({ status: 'FAILED' })
    .where(eq(inFlightNftTxTable.id, id));
  logger.warn(
    { id, error },
    'Marked in-flight NFT tx row %s FAILED: %s',
    id,
    error ?? 'unknown',
  );
}

/** Delete a single in-flight row by id (used by the per-op timer cleanup). */
export async function deleteInFlightNftTxRow({
  id,
}: {
  id: string;
}): Promise<void> {
  await db.delete(inFlightNftTxTable).where(eq(inFlightNftTxTable.id, id));
  logger.debug({ id }, 'Deleted in-flight NFT tx row %s', id);
}

/**
 * Has a single in-flight row (by id) become RESOLVED — i.e. it should no longer
 * appear in the optimistic overlay? `true` when the row no longer exists (already
 * reconciled / swept), is FAILED, is past its TTL, OR its change is already
 * reflected in the real indexed NFT (superseded). Drives the per-op
 * poll-until-indexed cleanup so a confirmed op's optimistic row is removed shortly
 * after it lands in the index instead of after the full 2-day timer. Compared
 * against the SAME real source the overlay reads (`nftIndexSchema."NamefiNft"`)
 * via the shared {@link inFlightNftSupersededExpr}, so "resolved" matches exactly
 * when the user-facing overlay stops showing the pending state.
 */
export async function isInFlightNftTxRowResolved({
  id,
}: {
  id: string;
}): Promise<{ resolved: boolean }> {
  const result = await db.execute<{ resolved: boolean }>(sql`
    SELECT NOT EXISTS (
      SELECT 1
      FROM ${inFlightNftTxTable} ift
      LEFT JOIN ${nftIndexSchema}."NamefiNft" rnft
        ON rnft.chain_id = ift.chain_id
       AND rnft.normalized_domain_name = ift.normalized_domain_name
      WHERE ift.id = ${id}
        AND ift.status <> 'FAILED'
        AND ift.expires_at > now()
        AND NOT (
          rnft.normalized_domain_name IS NOT NULL
          AND ${inFlightNftSupersededExpr('ift', 'rnft')}
        )
    ) AS resolved
  `);
  return { resolved: result.rows[0]?.resolved === true };
}

/**
 * Event-driven reconciliation: remove in-flight rows whose expected change is
 * now reflected in the real {@link managedNamefiNftTable} state. Run right after
 * the Ponder upsert in `syncNamefiNftsFromPonder`. Set-based so multiple rows /
 * domains reconcile in one statement; per-row + per-field so a confirmed mint is
 * removed while a still-pending expiration override on the same domain survives.
 */
export async function reconcileInFlightNftTxRows(): Promise<{
  deleted: number;
}> {
  const result = await db.execute(sql`
    DELETE FROM ${inFlightNftTxTable} ift
    USING ${managedNamefiNftTable} nft
    WHERE ift.chain_id = nft.chain_id
      AND ift.normalized_domain_name = nft.normalized_domain_name
      AND ift.status <> 'FAILED'
      AND ${inFlightNftSupersededExpr('ift', 'nft')}
  `);

  const deleted = result.rowCount ?? 0;
  if (deleted > 0) {
    logger.debug(
      { deleted },
      'Reconciled %d in-flight NFT tx row(s) against real state',
      deleted,
    );
  }
  return { deleted };
}

/**
 * TTL backstop: purge rows past `expires_at` (ops that never confirmed or were
 * never reconciled). Batched to bound each run.
 */
export async function sweepExpiredInFlightNftTxRows({
  batchSize = DEFAULT_SWEEP_BATCH_SIZE,
}: {
  batchSize?: number;
} = {}): Promise<{ deleted: number }> {
  if (!Number.isInteger(batchSize) || batchSize <= 0) {
    throw new Error('batchSize must be a positive integer');
  }

  const result = await db.execute(sql`
    DELETE FROM ${inFlightNftTxTable}
    WHERE id IN (
      SELECT id FROM ${inFlightNftTxTable}
      WHERE expires_at < now()
      LIMIT ${batchSize}
    )
  `);

  const deleted = result.rowCount ?? 0;
  if (deleted > 0) {
    logger.info(
      { deleted },
      'Swept %d expired in-flight NFT tx row(s)',
      deleted,
    );
  }
  return { deleted };
}

/**
 * Curated activity registry (functions only) so the module can also export
 * constants/types without registering them as Temporal activities.
 */
export const InFlightNftTxActivities = {
  insertInFlightNftTxRow,
  markInFlightNftTxConfirmed,
  markInFlightNftTxFailed,
  deleteInFlightNftTxRow,
  isInFlightNftTxRowResolved,
  reconcileInFlightNftTxRows,
  sweepExpiredInFlightNftTxRows,
};
