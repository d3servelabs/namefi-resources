import { db, linkSharesTable } from '@namefi-astra/db';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../base';
import { getPublicTweet } from '../../lib/get-public-tweet';

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

/**
 * Verify that a post URL is valid and the post exists.
 * Only validates X URLs, allowing other social media platforms to pass through.
 *
 * @param postUrl - The URL of the post to verify
 * @throws {TRPCError} When post verification fails with specific error codes:
 *   - BAD_REQUEST: Post not found, private, or URL invalid
 *   - TOO_MANY_REQUESTS: Rate limit exceeded
 */
async function verifyTweetExists(postUrl: string): Promise<void> {
  // Only verify X URLs - allow other social media platforms
  const isXUrl = postUrl.includes('x.com');
  if (!isXUrl) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unable to verify post.',
    });
  }

  // Basic URL pattern validation for X
  const postPattern = /x\.com\/\w+\/status\/\d+/;
  if (!postPattern.test(postUrl)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid X URL format. Please provide a valid post URL.',
    });
  }

  try {
    await getPublicTweet(postUrl);
  } catch (_error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Unable to verify post.',
    });
  }
}

export const shareRouter = createTRPCRouter({
  /**
   * Submit a social media share (authenticated)
   */
  submitShare: protectedProcedure
    .input(submitShareSchema)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      // Verify tweet exists before recording
      await verifyTweetExists(postUrl);

      try {
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
      } catch (_error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unable to record share.',
        });
      }
    }),

  /**
   * Submit a social media share (anonymous)
   */
  submitShareAnonymous: publicProcedure
    .input(submitShareSchema)
    .mutation(async ({ input }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      // Verify tweet exists before recording
      await verifyTweetExists(postUrl);

      try {
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
      } catch (_error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Unable to record share.',
        });
      }
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
