import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { z } from 'zod';

import type { RouterContract } from './trpc-contract';

/**
 * Contract for the PBN issuance reservations router.
 *
 * The router (`apps/backend/src/trpc/routers/pbnIssuanceReservationsRouter.ts`)
 * is type-checked against this contract via
 * `createContractTRPCRouter<typeof pbnIssuanceReservationsContract>`. The
 * router uses `withAudit(poweredByNamefiOwnerProcedure, ...)` for every
 * mutation — those middleware decisions stay at the call site.
 *
 * Activity output types (`CreateReservationOutput`,
 * `CreateReservationsBulkOutput`) are mirrored structurally below — they
 * live in `apps/backend/src/temporal/activities/pbn-issuance-reservations.activities.ts`
 * which `@namefi-astra/common` cannot import. Divergence is caught at the
 * contract-assignment site in the router file.
 */

// ---------------------------------------------------------------------------
// Shared input building blocks
// ---------------------------------------------------------------------------

const createReservationBaseInputSchema = z.object({
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
});

const createReservationInputSchema =
  createReservationBaseInputSchema.superRefine((v, ctx) => {
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

    if (v.reserveHold && (!hasExact || hasParent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'reserveHold requires exactDomainName and no parentDomain',
        path: ['exactDomainName'],
      });
    }

    if (hasParent && !v.issueFreeClaim) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'parentDomain requires issueFreeClaim=true',
        path: ['parentDomain'],
      });
    }

    if (!v.reserveHold && v.reservationExpirationDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'reservationExpirationDate must be null when reserveHold=false',
        path: ['reservationExpirationDate'],
      });
    }

    if (!v.issueFreeClaim && v.freeClaimExpirationDate != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'freeClaimExpirationDate must be null when issueFreeClaim=false',
        path: ['freeClaimExpirationDate'],
      });
    }
  });

// ---------------------------------------------------------------------------
// Activity output structural mirrors
// ---------------------------------------------------------------------------

/** Mirror of `CreateReservationOutput` from the activities layer. */
export type CreateReservationOutputLike = {
  reservationId: string;
  emailSent: boolean;
};

const createReservationOutputSchema = z.object({
  reservationId: z.string(),
  emailSent: z.boolean(),
});

/** Mirror of `CreateReservationsBulkOutput` from the activities layer. */
export type CreateReservationsBulkOutputLike = {
  createdCount: number;
  emailSentCount: number;
  failed: Array<{ index: number; error: string }>;
};

const createReservationsBulkOutputSchema = z.object({
  createdCount: z.number(),
  emailSentCount: z.number(),
  failed: z.array(
    z.object({
      index: z.number(),
      error: z.string(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// listByCreator output
// ---------------------------------------------------------------------------

const reservationStatusSchema = z.union([
  z.literal('CREATED'),
  z.literal('CANCELLED'),
]);

const reservationMetadataSchema = z
  .object({
    sendEmail: z.boolean().optional(),
    emailSent: z.boolean().optional(),
    emailSentAt: z.string().optional(),
    source: z
      .union([
        z.literal('ADMIN_GRANT'),
        z.literal('GIFT'),
        z.literal('INTERNAL_RESERVATION'),
      ])
      .optional(),
    internalReason: z.string().optional(),
    adminUserId: z.string().optional(),
  })
  .catchall(z.any());

const reservationRowSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  id: z.string(),
  pbnDomain: namefiNormalizedDomainSchema,
  recipientEmail: z.string().nullable(),
  recipientUserId: z.string().nullable(),
  exactDomainName: namefiNormalizedDomainSchema.nullable().optional(),
  parentDomain: namefiNormalizedDomainSchema.nullable().optional(),
  reason: z.string().nullable(),
  issueFreeClaim: z.boolean(),
  reserveHold: z.boolean(),
  creatorId: z.string(),
  personalMessage: z.string().nullable(),
  reservationExpirationDate: z.date().nullable(),
  freeClaimExpirationDate: z.date().nullable(),
  status: reservationStatusSchema,
  claimedAt: z.date().nullable(),
  freeClaimId: z.string().nullable(),
  metadata: reservationMetadataSchema.nullable(),
  uiStatus: z.string(),
  isActiveHold: z.boolean(),
});

const listByCreatorInputSchema = z.object({
  status: reservationStatusSchema.optional(),
  issueFreeClaim: z.boolean().optional(),
  pbnDomain: namefiNormalizedDomainSchema.optional(),
});

const listByCreatorOutputSchema = z.array(reservationRowSchema);

// ---------------------------------------------------------------------------
// cancel
// ---------------------------------------------------------------------------

const cancelInputSchema = z.object({
  reservationId: z.string().uuid(),
});

const cancelOutputSchema = z.object({
  success: z.boolean(),
  reservationId: z.string(),
  pbnDomain: namefiNormalizedDomainSchema,
});

// ---------------------------------------------------------------------------
// createBulk
// ---------------------------------------------------------------------------

const bulkReservationItemSchema = z
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
    message: 'Either exactDomainName or parentDomain must be provided',
    path: ['exactDomainName'],
  })
  .refine((v) => !(v.reserveHold && !v.exactDomainName), {
    message: 'reserveHold requires exactDomainName',
    path: ['reserveHold'],
  });

const createBulkInputSchema = z.object({
  pbnDomain: namefiNormalizedDomainSchema,
  items: z.array(bulkReservationItemSchema).min(1),
  sendEmail: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const pbnIssuanceReservationsContract = {
  create: {
    type: 'mutation',
    input: createReservationInputSchema,
    output: createReservationOutputSchema,
  },
  listByCreator: {
    type: 'query',
    input: listByCreatorInputSchema,
    output: listByCreatorOutputSchema,
  },
  cancel: {
    type: 'mutation',
    input: cancelInputSchema,
    output: cancelOutputSchema,
  },
  createBulk: {
    type: 'mutation',
    input: createBulkInputSchema,
    output: createReservationsBulkOutputSchema,
  },
} as const satisfies RouterContract;

export type PbnIssuanceReservationsContract =
  typeof pbnIssuanceReservationsContract;
