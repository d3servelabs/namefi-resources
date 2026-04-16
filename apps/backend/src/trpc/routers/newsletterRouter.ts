import { newsletterContract } from '@namefi-astra/common/contract/newsletter-contract';
import { publicProcedure } from '../base';
import { createContractTRPCRouter } from '../contract';
import { TRPCError } from '@trpc/server';
import { logger } from '#lib/logger';
import { secrets, config } from '#lib/env';
import { ListmonkClient } from '#lib/listmonk';
import { verifySolution } from 'altcha-lib';
import { db, usersTable } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { privyClient } from '#trpc/utils';

/**
 * Subscribe to newsletter using Listmonk with custom attributes
 */
async function subscribeToNewsletter(
  email: string,
  from: string,
  isNamefiUserWithSameEmail: boolean,
  name?: string,
  additionalAttributes?: Record<string, unknown>,
): Promise<void> {
  if (!secrets.LISTMONK_PASSWORD) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Newsletter service is not configured',
    });
  }

  const newsletterListId = config.LISTMONK_NEWSLETTER_LIST_ID;
  const defaultListId = config.LISTMONK_NAMEFI_LIST_ID;

  const listmonkConfig = {
    baseUrl: secrets.LISTMONK_BASE_URL || 'http://localhost:9000',
    username: secrets.LISTMONK_USERNAME || 'listmonk',
    password: secrets.LISTMONK_PASSWORD || '',
    defaultListId: defaultListId,
    newsletterListId: newsletterListId,
  };

  const listmonkClient = new ListmonkClient(listmonkConfig);

  try {
    // Prepare attributes
    const attributes: Record<string, unknown> = {
      from,
      subscribedAt: new Date().toISOString(),
      source: 'newsletter-form',
      ...additionalAttributes,
    };

    // Check if subscriber already exists
    const existingSubscriber = await listmonkClient.getSubscriberByEmail(email);

    if (existingSubscriber) {
      // Subscriber already exists - merge attributes and update
      const mergedAttributes = {
        ...existingSubscriber.attribs,
        newsletterAttributes: attributes,
      };

      // Build target lists based on whether they're a NameFi user
      const currentListIds = existingSubscriber.lists.map(
        (list: any) => list.id,
      );
      const targetListIds = isNamefiUserWithSameEmail
        ? Array.from(
            new Set([...currentListIds, defaultListId, newsletterListId]),
          )
        : Array.from(new Set([...currentListIds, newsletterListId]));

      // NameFi users get confirmed status, anonymous users need to confirm via email
      const subscriptionStatus = isNamefiUserWithSameEmail
        ? 'confirmed'
        : 'unconfirmed';

      // If subscriber has a userId, use the update method
      if (existingSubscriber.attribs.userId) {
        await listmonkClient.updateSubscriberByUserId(
          existingSubscriber.attribs.userId as string,
          {
            name: name || existingSubscriber.name,
            attribs: mergedAttributes,
            lists: targetListIds,
          },
        );

        // Update subscription status
        await listmonkClient.$updateSubscriberLists({
          action: 'add',
          listIds: [newsletterListId],
          subscriberIds: [existingSubscriber.id],
          status: subscriptionStatus,
        });
      } else {
        // For subscribers without userId, use the private method via bracket notation
        await (listmonkClient as any).$updateSubscriber(existingSubscriber, {
          email,
          name: name || existingSubscriber.name,
          status: 'enabled',
          attribs: mergedAttributes,
          lists: targetListIds,
        });

        // Update subscription status
        await listmonkClient.$updateSubscriberLists({
          action: 'add',
          listIds: [newsletterListId],
          subscriberIds: [existingSubscriber.id],
          status: subscriptionStatus,
        });
      }

      logger.debug(
        {
          email,
          subscriberId: existingSubscriber.id,
          from,
          hasName: !!name,
          isNamefiUserWithSameEmail,
          subscriptionStatus,
          attributes: mergedAttributes,
        },
        'Updated existing subscriber with new attributes',
      );
    } else {
      // Create new subscriber - only add to newsletter list (not default list)
      // since they're not an existing NameFi user
      // NameFi users get pre-confirmed, anonymous users need to confirm via email
      await (listmonkClient as any).$createSubscriber({
        email,
        name: name || '',
        status: 'enabled',
        attribs: attributes,
        lists: [newsletterListId],
        preconfirm_subscriptions: isNamefiUserWithSameEmail, // NameFi users don't need confirmation
      });

      logger.debug(
        {
          email,
          newsletterListId,
          from,
          hasName: !!name,
          isNamefiUserWithSameEmail,
          preconfirmed: isNamefiUserWithSameEmail,
          attributes,
        },
        'Successfully created new newsletter subscriber',
      );
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    logger.error(
      {
        error,
        email,
        from,
      },
      'Error subscribing to newsletter',
    );

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to subscribe to newsletter. Please try again later.',
    });
  }
}

export const newsletterRouter = createContractTRPCRouter<
  typeof newsletterContract
>({
  /**
   * Subscribe to newsletter - Public endpoint for anonymous users
   *
   * Stores subscriber with custom attributes including:
   * - from: Source of the subscription (e.g., 'namefi-home', 'namefi-park')
   * - subscribedAt: Timestamp of subscription
   * - source: Always set to 'newsletter-form'
   * - Any additional custom attributes passed
   */
  subscribe: publicProcedure
    .input(newsletterContract.subscribe.input)
    .output(newsletterContract.subscribe.output)
    .mutation(async ({ input, ctx }) => {
      const { email, name, from, attributes, altcha } = input;
      if (!altcha) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Altcha is required',
        });
      }
      const verified = await verifySolution(altcha, secrets.ALTCHA_HMAC_KEY);
      if (!verified) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid Altcha payload',
        });
      }

      let sameEmailAsAuthenticatedUser = false;

      // If this is a NameFi user, update their subscribeToEmails preference
      if (ctx.user?.privyUserId && ctx.user?.id) {
        const privyUser = await privyClient.getUserById(ctx.user.privyUserId);
        sameEmailAsAuthenticatedUser =
          !!privyUser?.email?.address &&
          privyUser.email.address.toLowerCase() === email.toLowerCase();
        if (sameEmailAsAuthenticatedUser) {
          try {
            await db
              .update(usersTable)
              .set({ subscribeToEmails: true })
              .where(eq(usersTable.id, ctx.user.id));

            logger.debug(
              { userId: ctx.user.id, email },
              'Updated NameFi user subscribeToEmails to true',
            );
          } catch (error) {
            logger.error(
              { error, userId: ctx.user.id },
              'Failed to update subscribeToEmails in database',
            );
          }
        }
      }

      await subscribeToNewsletter(
        email,
        from,
        sameEmailAsAuthenticatedUser,
        name,
        attributes,
      );

      return {
        success: true,
        message: sameEmailAsAuthenticatedUser
          ? 'Successfully subscribed!'
          : 'Successfully subscribed! Please check your email to confirm.',
      };
    }),
});
