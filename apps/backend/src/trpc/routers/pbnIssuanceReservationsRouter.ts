import { z } from 'zod';
import {
  createTRPCRouter,
  poweredByNamefiOwnerProcedure,
  withAudit,
} from '../base';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { TRPCError } from '@trpc/server';
import {
  createReservation,
  createReservationsBulk,
  cancelReservation,
} from '#temporal/activities/pbn-issuance-reservations.activities';
import { db, pbnIssuanceReservationsTable } from '@namefi-astra/db';
import { and, desc, eq } from 'drizzle-orm';

const createReservationInputSchema = z
  .object({
    pbnDomain: namefiNormalizedDomainSchema,
    recipientEmail: z.string().email().optional(),
    exactDomainName: namefiNormalizedDomainSchema.optional(),
    parentDomain: namefiNormalizedDomainSchema.optional(),
    reason: z.string().optional(),
    issueFreeClaim: z.boolean().default(false),
    reserveHold: z.boolean().default(true),
    reservationExpirationDate: z.date().nullable().optional(),
    freeClaimExpirationDate: z.date().nullable().optional(),
    personalMessage: z.string().optional(),
    sendEmail: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    const hasExact = !!v.exactDomainName;
    const hasParent = !!v.parentDomain;

    // XOR(exactDomainName, parentDomain)
    if (hasExact === hasParent) {
      const message = 'Provide exactly one of exactDomainName or parentDomain';
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ['exactDomainName'],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ['parentDomain'],
      });
    }

    // Hold allowed only on exact; parent must be omitted
    if (v.reserveHold && (!hasExact || hasParent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'reserveHold requires exactDomainName and no parentDomain',
        path: ['exactDomainName'],
      });
    }

    // Parent only when issuing a free claim
    if (hasParent && !v.issueFreeClaim) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parentDomain requires issueFreeClaim=true',
        path: ['parentDomain'],
      });
    }

    // reservationExpirationDate only when reserveHold=true
    if (!v.reserveHold && v.reservationExpirationDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'reservationExpirationDate must be null when reserveHold=false',
        path: ['reservationExpirationDate'],
      });
    }

    // freeClaimExpirationDate only when issuing
    if (!v.issueFreeClaim && v.freeClaimExpirationDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'freeClaimExpirationDate must be null when issueFreeClaim=false',
        path: ['freeClaimExpirationDate'],
      });
    }
  });

export const pbnIssuanceReservationsRouter = createTRPCRouter({
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
    .input(createReservationInputSchema)
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
    .input(
      z.object({
        status: z.enum(['CREATED', 'CANCELLED']).optional(),
        issueFreeClaim: z.boolean().optional(),
        pbnDomain: namefiNormalizedDomainSchema.optional(),
      }),
    )
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
    .input(z.object({ reservationId: z.string().uuid() }))
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
    .input(
      z.object({
        pbnDomain: namefiNormalizedDomainSchema,
        items: z
          .array(
            z
              .object({
                recipientEmail: z.string().email(),
                exactDomainName: namefiNormalizedDomainSchema.optional(),
                parentDomain: namefiNormalizedDomainSchema.optional(),
                reason: z.string().optional(),
                personalMessage: z.string().optional(),
                issueFreeClaim: z.boolean().optional(),
                reserveHold: z.boolean().optional(),
                reservationExpirationDate: z.date().nullable().optional(),
                freeClaimExpirationDate: z.date().nullable().optional(),
              })
              .refine((v) => v.exactDomainName || v.parentDomain, {
                message:
                  'Either exactDomainName or parentDomain must be provided',
                path: ['exactDomainName'],
              })
              .refine((v) => !(v.reserveHold && !v.exactDomainName), {
                message: 'reserveHold requires exactDomainName',
                path: ['reserveHold'],
              }),
          )
          .min(1),
        sendEmail: z.boolean().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      }),
    )
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
