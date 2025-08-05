import { db, linkSharesTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../base';

// Input schemas
const submitShareSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
  postUrl: z.string().url('Invalid post URL'),
  campaignKey: z.string().optional(),
});

const hasUserSharedSchema = z.object({
  normalizedDomainName: namefiNormalizedDomainSchema,
});

// Helper function to build share URL using request origin
function buildShareUrl(
  domainName: string,
  origin: string,
  campaignKey?: string,
): string {
  const params = new URLSearchParams({
    utm_source: 'twitter',
    utm_medium: 'share',
    utm_campaign: campaignKey || 'cv_hunt',
    utm_content: domainName,
  });

  // Use the origin from the request to build the URL
  const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;
  return `${baseUrl}/cv/${domainName}?${params.toString()}`;
}

export const shareRouter = createTRPCRouter({
  /**
   * Submit a social media share
   */
  submitShare: protectedProcedure
    .input(submitShareSchema)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName, postUrl, campaignKey } = input;

      // Get origin from request headers
      const origin =
        ctx.req.header('Origin') ||
        ctx.req.header('Referer') ||
        'https://namefi.io';

      // Generate standard shared URL using request origin
      const sharedUrl = buildShareUrl(
        normalizedDomainName,
        origin,
        campaignKey,
      );

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
      };
    }),
});
