import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../base';
import { TRPCError } from '@trpc/server';
import { logger } from '#lib/logger';
import { secrets } from '#lib/env';
import { ListmonkClient } from '#lib/listmonk';

const subscribeToNewsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
  /**
   * Source/origin of the subscription (e.g., 'namefi-home', 'namefi-park', 'newsletter-page')
   */
  from: z.string().min(1, 'Source is required'),
  /**
   * Additional custom attributes to store with the subscriber
   */
  attributes: z.record(z.unknown()).optional(),
});

const newsletterListId = 2;
/**
 * Subscribe to newsletter using Listmonk with custom attributes
 */
async function subscribeToNewsletter(
  email: string,
  from: string,
  name?: string,
  additionalAttributes?: Record<string, unknown>,
): Promise<void> {
  if (!secrets.LISTMONK_PASSWORD) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Newsletter service is not configured',
    });
  }

  const listmonkConfig = {
    baseUrl: secrets.LISTMONK_BASE_URL || 'http://localhost:9000',
    username: secrets.LISTMONK_USERNAME || 'listmonk',
    password: secrets.LISTMONK_PASSWORD || '',
    defaultListId: newsletterListId,
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

      // If subscriber has a userId, use the update method
      if (existingSubscriber.attribs.userId) {
        await listmonkClient.updateSubscriberByUserId(
          existingSubscriber.attribs.userId as string,
          {
            name: name || existingSubscriber.name,
            attribs: mergedAttributes,
            lists: existingSubscriber.lists
              .map((list: any) => list.id)
              .concat([newsletterListId]),
          },
        );
      } else {
        // For subscribers without userId, use the private method via bracket notation
        await (listmonkClient as any).$updateSubscriber(existingSubscriber, {
          email,
          name: name || existingSubscriber.name,
          status: 'enabled',
          attribs: mergedAttributes,
          lists: existingSubscriber.lists
            .map((list: any) => list.id)
            .concat([newsletterListId]),
        });
      }

      logger.info(
        {
          email,
          subscriberId: existingSubscriber.id,
          from,
          hasName: !!name,
          attributes: mergedAttributes,
        },
        'Updated existing subscriber with new attributes',
      );
    } else {
      // Create new subscriber using private method via bracket notation
      await (listmonkClient as any).$createSubscriber({
        email,
        name: name || '',
        status: 'enabled',
        attribs: attributes,
        lists: [listmonkConfig.defaultListId],
        preconfirm_subscriptions: false, // Send confirmation email
      });

      logger.info(
        {
          email,
          listId: listmonkConfig.defaultListId,
          from,
          hasName: !!name,
          attributes,
        },
        'Successfully created new subscriber',
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

export const newsletterRouter = createTRPCRouter({
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
    .input(subscribeToNewsletterSchema)
    .mutation(async ({ input }) => {
      const { email, name, from, attributes } = input;

      await subscribeToNewsletter(email, from, name, attributes);

      return {
        success: true,
        message: 'Successfully subscribed! Please check your email to confirm.',
      };
    }),
});
