import { db, linkSharesTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';

// Input schemas
const submitShareSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  postUrl: z.string().url('Invalid post URL'),
  sharedUrl: z.string().url('Invalid shared URL'),
  campaignKey: z.string().optional(),
});

const hasUserSharedSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

export const shareRouter = createTRPCRouter({
  /**
   * Submit a social media share (authenticated)
   */
  submitShare: protectedProcedure
    .input(submitShareSchema)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      const [share] = await db
        .insert(linkSharesTable)
        .values({
          userId: ctx.user.id,
          normalizedDomainName,
          postUrl,
          sharedUrl,
          campaignKey: campaignKey || null,
        })
        .returning();

      return {
        id: share.id,
        sharedUrl,
        success: true,
      };
    }),

  /**
   * Submit a social media share (anonymous)
   */
  submitShareAnonymous: publicProcedure
    .input(submitShareSchema)
    .mutation(async ({ input }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      const [share] = await db
        .insert(linkSharesTable)
        .values({
          userId: null, // Anonymous share
          normalizedDomainName,
          postUrl,
          sharedUrl,
          campaignKey: campaignKey || null,
        })
        .returning();

      return {
        id: share.id,
        sharedUrl,
        success: true,
      };
    }),

  /**
   * Check if authenticated user has shared a specific domain
   */
  hasUserShared: protectedProcedure
    .input(hasUserSharedSchema)
    .query(async ({ input, ctx }) => {
      const { normalizedDomainName } = input;

      const share = await db.query.linkSharesTable.findFirst({
        where: and(
          eq(linkSharesTable.userId, ctx.user.id),
          eq(linkSharesTable.normalizedDomainName, normalizedDomainName),
        ),
      });

      return {
        hasShared: !!share,
        shareDate: share?.createdAt || null,
        sharedUrl: share?.sharedUrl || null,
      };
    }),
});
