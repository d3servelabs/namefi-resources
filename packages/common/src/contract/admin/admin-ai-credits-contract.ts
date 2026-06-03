import { z } from 'zod';

import { createContract } from '../create-contract';

const awardUserSummarySchema = z.object({
  id: z.string().uuid(),
  primaryEmail: z.string().nullable(),
  displayName: z.string().nullable(),
  walletAddresses: z.array(z.string()),
});

const aiCreditAwardRowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  awardedByAdminUserId: z.string().uuid().nullable(),
  amountCredits: z.number().int().positive(),
  reason: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: awardUserSummarySchema.nullable(),
  awardedByAdmin: awardUserSummarySchema.nullable(),
});

const listAwardsInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(25),
  searchTerm: z.string().trim().max(100).optional(),
  userId: z.string().uuid().optional(),
});

const listAwardsOutputSchema = z.object({
  data: z.array(aiCreditAwardRowSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

const awardCreditsInputSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(500),
  amountCredits: z.number().int().min(1).max(10_000),
  reason: z.string().trim().min(1).max(500),
});

const awardCreditsOutputSchema = z.object({
  success: z.boolean(),
  awards: z.array(aiCreditAwardRowSchema),
  summary: z.object({
    requested: z.number(),
    created: z.number(),
  }),
});

export const adminAiCreditsContract = createContract(
  { softOutput: true },
  {
    listAwards: {
      type: 'query',
      input: listAwardsInputSchema,
      output: listAwardsOutputSchema,
    },
    awardCredits: {
      type: 'mutation',
      input: awardCreditsInputSchema,
      output: awardCreditsOutputSchema,
    },
  },
);

export type AdminAiCreditsContract = typeof adminAiCreditsContract;
