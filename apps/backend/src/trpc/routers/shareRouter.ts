import { db, linkSharesTable } from '@namefi-astra/db';
import { shareContract } from '@namefi-astra/common/share-contract';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, withAudit } from '../base';
import { createContractTRPCRouter } from '../contract';
import {
  validateTweet,
  type ValidatedPublicTweet,
} from '../../lib/twitter/validate-tweet';

export const shareRouter = createContractTRPCRouter<typeof shareContract>({
  /**
   * Submit a social media share (authenticated)
   */
  submitShare: withAudit(
    protectedProcedure,
    ({ ctx, input, auditActorExtraInfo, result }) => ({
      actorType: 'user',
      actorId: ctx.user?.id || 'unknown',
      actorExtraInfo: auditActorExtraInfo,
      resourceType: 'link_share',
      resourceId: result?.id || '',
      action: 'create',
      extraInput: input,
    }),
  )
    .input(shareContract.submitShare.input)
    .output(shareContract.submitShare.output)
    .mutation(async ({ input, ctx }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      // Validate the tweet content and URL
      let validatedTweet: ValidatedPublicTweet;
      try {
        validatedTweet = await validateTweet({
          postUrl,
          sharedUrl,
          requiredHashtags: ['#namefi'],
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid tweet content.',
        });
      }

      try {
        const [share] = await db
          .insert(linkSharesTable)
          .values({
            userId: ctx.user.id,
            type: 'twitter',
            normalizedDomainName,
            postUrl,
            sharedUrl,
            campaignKey: campaignKey || null,
            externalIdentifier: validatedTweet.author.username,
            verified: true,
            verifiedAt: new Date(),
          })
          .returning();

        return {
          id: share.id,
          sharedUrl,
          success: true as const,
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
    .input(shareContract.submitShareAnonymous.input)
    .output(shareContract.submitShareAnonymous.output)
    .mutation(async ({ input }) => {
      const { normalizedDomainName, postUrl, sharedUrl, campaignKey } = input;

      // Enforce content rules: must contain sharedUrl and #namefi hashtag
      let validatedTweet: ValidatedPublicTweet;
      try {
        validatedTweet = await validateTweet({
          postUrl,
          sharedUrl,
          requiredHashtags: ['#namefi'],
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid tweet content.',
        });
      }

      try {
        const [share] = await db
          .insert(linkSharesTable)
          .values({
            userId: null, // Anonymous share
            type: 'twitter',
            normalizedDomainName,
            postUrl,
            sharedUrl,
            campaignKey: campaignKey || null,
            externalIdentifier: validatedTweet.author.username,
            verified: true,
            verifiedAt: new Date(),
          })
          .returning();

        return {
          id: share.id,
          sharedUrl,
          success: true as const,
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
    .input(shareContract.hasUserShared.input)
    .output(shareContract.hasUserShared.output)
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
