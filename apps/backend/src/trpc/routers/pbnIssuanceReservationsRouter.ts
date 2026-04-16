import { pbnIssuanceReservationsContract } from '@namefi-astra/common/contract/pbn-issuance-reservations-contract';
import { poweredByNamefiOwnerProcedure, withAudit } from '../base';
import { createContractTRPCRouter } from '../contract';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  createReservation,
  createReservationsBulk,
  cancelReservation,
} from '#temporal/activities/pbn-issuance-reservations.activities';
import { db, pbnIssuanceReservationsTable } from '@namefi-astra/db';
import { and, desc, eq } from 'drizzle-orm';

export const pbnIssuanceReservationsRouter = createContractTRPCRouter<
  typeof pbnIssuanceReservationsContract
>({
  create: withAudit(
    poweredByNamefiOwnerProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.pbnDomain,
      action: 'issue_reservation_gift',
      extraInput: input,
    }),
  )
    .input(pbnIssuanceReservationsContract.create.input)
    .output(pbnIssuanceReservationsContract.create.output)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createReservation({
          pbnDomain: input.pbnDomain,
          recipientEmail: input.recipientEmail,
          exactDomainName: input.exactDomainName as
            | NamefiNormalizedDomain
            | undefined,
          parentDomain: input.parentDomain as
            | NamefiNormalizedDomain
            | undefined,
          reason: input.reason,
          issueFreeClaim: input.issueFreeClaim,
          reserveHold: input.reserveHold,
          reservationExpirationDate: input.reservationExpirationDate ?? null,
          freeClaimExpirationDate: input.freeClaimExpirationDate ?? null,
          creatorId: ctx.user.id,
          personalMessage: input.personalMessage,
          sendEmail: input.sendEmail,
          metadata: {},
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create reservation',
        });
      }
    }),

  listByCreator: poweredByNamefiOwnerProcedure
    .input(pbnIssuanceReservationsContract.listByCreator.input)
    .output(pbnIssuanceReservationsContract.listByCreator.output)
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(pbnIssuanceReservationsTable.creatorId, ctx.user.id),
      ];
      if (input.status)
        conditions.push(eq(pbnIssuanceReservationsTable.status, input.status));
      if (typeof input.issueFreeClaim === 'boolean')
        conditions.push(
          eq(pbnIssuanceReservationsTable.issueFreeClaim, input.issueFreeClaim),
        );
      if (input.pbnDomain) {
        conditions.push(
          eq(pbnIssuanceReservationsTable.pbnDomain, input.pbnDomain as any),
        );
      }

      const rows = await db
        .select()
        .from(pbnIssuanceReservationsTable)
        .where(and(...conditions))
        .orderBy(desc(pbnIssuanceReservationsTable.createdAt));

      const now = new Date();
      return rows.map((r) => ({
        ...r,
        uiStatus: r.freeClaimId
          ? 'CLAIMED'
          : r.status === 'CANCELLED'
            ? 'CANCELLED'
            : r.issueFreeClaim &&
                r.freeClaimExpirationDate &&
                r.freeClaimExpirationDate <= now
              ? 'EXPIRED'
              : 'CREATED',
        isActiveHold:
          !!r.reserveHold &&
          r.status === 'CREATED' &&
          (!r.reservationExpirationDate || r.reservationExpirationDate > now),
      }));
    }),

  cancel: withAudit(
    poweredByNamefiOwnerProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: result.pbnDomain,
      action: 'cancel_reservation_gift',
      extraInput: input,
    }),
  )
    .input(pbnIssuanceReservationsContract.cancel.input)
    .output(pbnIssuanceReservationsContract.cancel.output)
    .mutation(async ({ ctx, input }) => {
      // ensure ownership
      const records = await db
        .select({
          id: pbnIssuanceReservationsTable.id,
          pbnDomain: pbnIssuanceReservationsTable.pbnDomain,
        })
        .from(pbnIssuanceReservationsTable)
        .where(
          and(
            eq(pbnIssuanceReservationsTable.id, input.reservationId),
            eq(pbnIssuanceReservationsTable.creatorId, ctx.user.id),
            eq(pbnIssuanceReservationsTable.status, 'CREATED'),
          ),
        )
        .limit(1);
      const record = records[0];

      if (records.length === 0 || !record)
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        });

      await cancelReservation(input.reservationId, ctx.user.id);
      return {
        success: true,
        reservationId: input.reservationId,
        pbnDomain: record.pbnDomain,
      };
    }),

  createBulk: withAudit(
    poweredByNamefiOwnerProcedure,
    ({ ctx, input, auditActorExtraInfo }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'pbn_domain',
      resourceId: input.pbnDomain,
      action: 'issue_bulk_reservation_gifts',
      extraInput: input,
    }),
  )
    .input(pbnIssuanceReservationsContract.createBulk.input)
    .output(pbnIssuanceReservationsContract.createBulk.output)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createReservationsBulk({
          pbnDomain: input.pbnDomain as NamefiNormalizedDomain,
          creatorId: ctx.user.id,
          items: input.items as any,
          sendEmail: input.sendEmail ?? true,
          metadata: input.metadata ?? {},
        });
        return result;
      } catch (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to create bulk reservations',
        });
      }
    }),
});
