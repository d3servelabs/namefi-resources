import { privyClient } from '../trpc/utils';
import type { User as PrivyUser } from '@privy-io/server-auth';
import { logger } from '../lib/logger';
import { secrets, config } from '../lib/env';
import { db, usersTable } from '@namefi-astra/db';
import {
  privyStorageToPrivyCustomMetadata,
  type PrivyCustomMetadata,
} from '../trpc/types';
import Bottleneck from 'bottleneck';
import { lazy } from '@namefi-astra/utils/lazy';
import pMap from 'p-map';
import { eq } from 'drizzle-orm';
import { equals } from 'ramda';
import { z } from 'zod';

export interface ListmonkSubscriber {
  email: string;
  name?: string;
  status: 'enabled' | 'blocklisted'; //| 'disabled'
  attribs: {
    privyUserId?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  lists: number[];
}

export interface ListmonkSubscriberResponse
  extends Omit<ListmonkSubscriber, 'lists'> {
  id: number;
  uuid: string;
  created_at: string;
  updated_at: string;
  lists: {
    subscription_status: 'confirmed' | 'unsubscribed' | 'unconfirmed';
    subscription_created_at: string;
    subscription_updated_at: string;
    subscription_meta: Record<string, unknown>;
    id: number;
    uuid: string;
    name: string;
    type: 'public' | 'private';
    optin: 'single' | 'double';
    tags: string[] | null;
    description: string;
    created_at: string;
    updated_at: string;
  }[];
}

export interface ListmonkBounce {
  id: number;
  type: 'soft' | 'hard' | 'complaint';
  source: string;
  meta: Record<string, unknown>;
  created_at: string;
  campaign?: {
    id: number;
    name: string;
  };
}

export interface GetSubscribersOptions {
  query?: string;
  listId?: number;
  page?: number;
  perPage?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export type UpdateSubscriberListsOptions =
  | {
      action: 'remove' | 'unsubscribe';
      listIds: number[];
      subscriberIds: number[];
    }
  | {
      action: 'add';
      listIds: number[];
      subscriberIds: number[];
      status: 'confirmed' | 'unsubscribed' | 'unconfirmed';
    };

export interface EnrichedUser {
  privyUser: PrivyUser;
  dbUserId: string;
  subscribeToEmails: boolean;
}

export interface ListmonkConfig {
  baseUrl: string;
  username: string;
  password: string;
  defaultListId: number;
  newsletterListId?: number;
}

export interface CreateNewSubscriberInput {
  email: string;
  name?: string;
  status: 'enabled' | 'blocklisted';
  attribs: {
    privyUserId?: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    [key: string]: unknown;
  };
  lists: number[];
  preconfirm_subscriptions: boolean;
}

export const LISTMONK_CONFIG: ListmonkConfig = {
  baseUrl: secrets.LISTMONK_BASE_URL || 'http://localhost:9000',
  username: secrets.LISTMONK_USERNAME || 'listmonk',
  password: secrets.LISTMONK_PASSWORD || '',
  defaultListId: config.LISTMONK_NAMEFI_LIST_ID,
  newsletterListId: config.LISTMONK_NEWSLETTER_LIST_ID,
};

const limiter = new Bottleneck({
  reservoir: 50,
  reservoirRefreshAmount: 50,
  reservoirRefreshInterval: 1000,
});

/**
 * Listmonk API client with rate limiting and comprehensive subscriber management.
 *
 * Naming convention:
 * - Methods prefixed with `$` make direct API calls to Listmonk and are rate-limited
 * - Other methods are higher-level operations that may compose multiple API calls
 */
export class ListmonkClient {
  static config: ListmonkConfig = LISTMONK_CONFIG;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: ListmonkConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`;
  }

  async upsertSubscriber(subscriber: ListmonkSubscriber): Promise<void> {
    try {
      // First, check if subscriber exists by userId
      let existingSubscriber: ListmonkSubscriberResponse | null = null;

      if (subscriber.attribs.userId) {
        existingSubscriber = await this.getSubscriberByUserId(
          subscriber.attribs.userId,
        );
      }

      // If not found by userId, try by email
      if (!existingSubscriber) {
        existingSubscriber = await this.getSubscriberByEmail(subscriber.email);
      }

      if (existingSubscriber) {
        // Update existing subscriber
        await this.$updateSubscriber(existingSubscriber, subscriber);

        // Ensure all list subscriptions are confirmed for NameFi users
        const listsToConfirm = subscriber.lists.filter(
          (listId) =>
            !existingSubscriber!.lists?.some(
              (list) =>
                list.id === listId && list.subscription_status === 'confirmed',
            ),
        );

        if (listsToConfirm.length > 0) {
          await this.$updateSubscriberLists({
            action: 'add',
            listIds: listsToConfirm,
            subscriberIds: [existingSubscriber.id],
            status: 'confirmed',
          });
          logger.debug(
            {
              email: subscriber.email,
              listsConfirmed: listsToConfirm,
            },
            'Confirmed list subscriptions for existing subscriber',
          );
        }
      } else {
        // Create new subscriber with preconfirmed subscriptions
        await this.$createSubscriber({
          email: subscriber.email,
          name: subscriber.name,
          status: subscriber.status,
          attribs: subscriber.attribs,
          lists: subscriber.lists,
          preconfirm_subscriptions: true, // NameFi users get preconfirmed subscriptions
        });
      }
    } catch (error) {
      logger.error(
        { error, email: subscriber.email },
        'Failed to upsert subscriber',
      );
      throw error;
    }
  }

  /**
   * Create a new subscriber in Listmonk (direct API call)
   */
  private async $createSubscriber(
    subscriber: CreateNewSubscriberInput,
  ): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(`${this.baseUrl}/api/subscribers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify(subscriber),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create subscriber: ${response.status} ${errorText}`,
        );
      }

      logger.debug(
        { email: subscriber.email },
        'Successfully created new subscriber in Listmonk',
      );
    });
  }

  /**
   * Update an existing subscriber using their Listmonk ID (direct API call)
   */
  private async $updateSubscriber(
    existingSubscriber: ListmonkSubscriberResponse,
    updatedData: ListmonkSubscriber,
  ): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/${existingSubscriber.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          body: JSON.stringify({
            ...updatedData,
            id: existingSubscriber.id,
            uuid: existingSubscriber.uuid,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update existing subscriber: ${response.status} ${errorText}`,
        );
      }

      logger.debug(
        { email: updatedData.email, subscriberId: existingSubscriber.id },
        'Successfully updated existing subscriber in Listmonk',
      );
    });
  }

  /**
   * Unsubscribe a subscriber from all lists by email
   */
  async unsubscribeSubscriberByEmail(email: string): Promise<void> {
    try {
      const existingSubscriber = await this.getSubscriberByEmail(email);

      if (!existingSubscriber) {
        logger.debug({ email }, 'Subscriber not found for unsubscribe');
        return;
      }

      if (!existingSubscriber.lists || existingSubscriber.lists.length === 0) {
        logger.debug({ email }, 'Subscriber not subscribed to any lists');
        return;
      }

      await this.$updateSubscriberLists({
        action: 'unsubscribe',
        listIds: existingSubscriber.lists.map((list) => list.id),
        subscriberIds: [existingSubscriber.id],
      });

      logger.debug(
        { email, lists: existingSubscriber.lists },
        'Successfully unsubscribed subscriber from all lists',
      );
    } catch (error) {
      logger.error({ error, email }, 'Failed to unsubscribe subscriber');
      throw error;
    }
  }

  /**
   * Unsubscribe subscriber from all lists by userId
   */
  async unsubscribeSubscriberByUserId(userId: string): Promise<void> {
    try {
      const existingSubscriber = await this.getSubscriberByUserId(userId);

      if (!existingSubscriber) {
        logger.debug({ userId }, 'Subscriber not found for unsubscribe');
        return;
      }

      if (!existingSubscriber.lists || existingSubscriber.lists.length === 0) {
        logger.debug(
          { userId, email: existingSubscriber.email },
          'Subscriber not subscribed to any lists',
        );
        return;
      }

      await this.$updateSubscriberLists({
        action: 'unsubscribe',
        listIds: existingSubscriber.lists.map((list) => list.id),
        subscriberIds: [existingSubscriber.id],
      });

      logger.debug(
        {
          userId,
          email: existingSubscriber.email,
          lists: existingSubscriber.lists,
        },
        'Successfully unsubscribed subscriber from all lists by userId',
      );
    } catch (error) {
      logger.error(
        { error, userId },
        'Failed to unsubscribe subscriber by userId',
      );
      throw error;
    }
  }

  // Deprecated: Use unsubscribeSubscriberByEmail instead
  async removeSubscriber(email: string): Promise<void> {
    logger.warn(
      { email },
      'removeSubscriber is deprecated, use unsubscribeSubscriberByEmail instead',
    );
    await this.unsubscribeSubscriberByEmail(email);
  }

  /**
   * Get all subscribers with optional filtering and pagination (direct API call)
   */
  async $getSubscribers(options?: GetSubscribersOptions): Promise<{
    data: {
      results: ListmonkSubscriberResponse[];
      total: number;
      per_page: number;
      page: number;
    };
  }> {
    return await limiter.schedule(async () => {
      const params = new URLSearchParams();

      if (options?.query) params.append('query', options.query);
      if (options?.listId) params.append('list_id', options.listId.toString());
      if (options?.page) params.append('page', options.page.toString());
      if (options?.perPage)
        params.append('per_page', options.perPage.toString());
      if (options?.orderBy) params.append('order_by', options.orderBy);
      if (options?.order) params.append('order', options.order);

      const response = await fetch(
        `${this.baseUrl}/api/subscribers?${params}`,
        {
          headers: { Authorization: this.authHeader },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get subscribers: ${response.status}`);
      }

      return await response.json();
    });
  }

  /**
   * Get a specific subscriber by ID (direct API call)
   */
  async $getSubscriber(
    subscriberId: number,
  ): Promise<{ data: ListmonkSubscriberResponse }> {
    return await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/${subscriberId}`,
        {
          headers: { Authorization: this.authHeader },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get subscriber: ${response.status}`);
      }

      return await response.json();
    });
  }

  /**
   * Get subscriber by email
   */
  async getSubscriberByEmail(
    email: string,
  ): Promise<ListmonkSubscriberResponse | null> {
    const validatedEmail = z.string().email().safeParse(email);
    if (!validatedEmail.success) {
      return null;
    }
    try {
      const response = await this.$getSubscribers({
        query: `subscribers.email = '${validatedEmail.data}'`,
      });

      const subscriber = response.data.results[0];
      return subscriber || null;
    } catch (error) {
      logger.error({ error, email }, 'Failed to get subscriber by email');
      return null;
    }
  }

  /**
   * Get subscriber by userId (from custom attributes)
   */
  async getSubscriberByUserId(
    userId: string,
  ): Promise<ListmonkSubscriberResponse | null> {
    const validatedUserId = z
      .union([z.string().uuid(), z.coerce.number()])
      .safeParse(userId);
    if (!validatedUserId.success) {
      return null;
    }
    try {
      const response = await this.$getSubscribers({
        query: `subscribers.attribs->>'userId' = '${validatedUserId.data}'`,
      });

      const subscriber = response.data.results[0];
      return subscriber || null;
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get subscriber by userId');
      return null;
    }
  }

  /**
   * Get subscriber by privyUserId (from custom attributes)
   */
  async getSubscriberByPrivyUserId(
    privyUserId: string,
  ): Promise<ListmonkSubscriberResponse | null> {
    try {
      const response = await this.$getSubscribers({
        query: `subscribers.attribs->>'privyUserId' = '${privyUserId}'`,
      });

      const subscriber = response.data.results[0];
      return subscriber || null;
    } catch (error) {
      logger.error(
        { error, privyUserId },
        'Failed to get subscriber by privyUserId',
      );
      return null;
    }
  }

  /**
   * Get subscribers by custom attribute
   */
  async getSubscribersByAttribute(
    attributeName: string,
    attributeValue: string,
  ): Promise<ListmonkSubscriberResponse[]> {
    try {
      const response = await this.$getSubscribers({
        query: `subscribers.attribs->>'${attributeName}' = '${attributeValue}'`,
      });

      return response.data.results;
    } catch (error) {
      logger.error(
        { error, attributeName, attributeValue },
        'Failed to get subscribers by attribute',
      );
      return [];
    }
  }

  /**
   * Get enabled subscribers with specific attributes
   */
  async getEnabledSubscribersWithUserId(): Promise<
    ListmonkSubscriberResponse[]
  > {
    try {
      const response = await this.$getSubscribers({
        query: `subscribers.status = 'enabled' AND subscribers.attribs ? 'userId'`,
      });

      return response.data.results;
    } catch (error) {
      logger.error({ error }, 'Failed to get enabled subscribers with userId');
      return [];
    }
  }

  /**
   * Unsubscribe all subscribers by userId attribute from all lists
   */
  async unsubscribeSubscribersByUserId(userId: string): Promise<void> {
    try {
      const subscribers = await this.getSubscribersByAttribute(
        'userId',
        userId,
      );

      for (const subscriber of subscribers) {
        if (subscriber.lists && subscriber.lists.length > 0) {
          await this.$updateSubscriberLists({
            action: 'unsubscribe',
            listIds: subscriber.lists.map((list) => list.id),
            subscriberIds: [subscriber.id],
          });
          logger.debug(
            {
              userId,
              subscriberId: subscriber.id,
              email: subscriber.email,
              lists: subscriber.lists,
            },
            'Unsubscribed subscriber from all lists',
          );
        }
      }

      logger.debug(
        { userId, count: subscribers.length },
        'Successfully unsubscribed all subscribers by userId',
      );
    } catch (error) {
      logger.error(
        { error, userId },
        'Failed to unsubscribe subscribers by userId',
      );
      throw error;
    }
  }

  // Deprecated: Use unsubscribeSubscribersByUserId instead
  async deleteSubscribersByUserId(userId: string): Promise<void> {
    logger.warn(
      { userId },
      'deleteSubscribersByUserId is deprecated, use unsubscribeSubscribersByUserId instead',
    );
    await this.unsubscribeSubscribersByUserId(userId);
  }

  /**
   * Update subscriber by userId (namefi id)
   */
  async updateSubscriberByUserId(
    userId: string,
    updatedData: Partial<ListmonkSubscriber>,
  ): Promise<void> {
    try {
      const existingSubscriber = await this.getSubscriberByUserId(userId);
      if (!existingSubscriber) {
        logger.warn({ userId }, 'Subscriber not found for update');
        return;
      }

      // Merge existing data with updates
      const mergedData: ListmonkSubscriber = {
        email: updatedData.email ?? existingSubscriber.email,
        name: updatedData.name ?? existingSubscriber.name,
        status: updatedData.status ?? existingSubscriber.status,
        attribs: { ...existingSubscriber.attribs, ...updatedData.attribs },
        lists:
          updatedData.lists ?? existingSubscriber.lists.map((list) => list.id),
      };

      await this.$updateSubscriber(existingSubscriber, mergedData);
      logger.debug(
        { userId, email: mergedData.email },
        'Successfully updated subscriber by userId',
      );
    } catch (error) {
      logger.error({ error, userId }, 'Failed to update subscriber by userId');
      throw error;
    }
  }

  /**
   * Update subscriber status by userId
   */
  async updateSubscriberStatusByUserId(
    userId: string,
    status: 'enabled' | 'blocklisted',
  ): Promise<void> {
    await this.updateSubscriberByUserId(userId, { status });
  }

  /**
   * Export subscriber data (direct API call)
   */
  async $exportSubscriber(subscriberId: number): Promise<{
    profile: ListmonkSubscriberResponse;
    subscriptions: Array<{ id: number; name: string; status: string }>;
    campaign_views: Array<{ id: number; name: string; timestamp: string }>;
    link_clicks: Array<{ url: string; timestamp: string }>;
  }> {
    return await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/${subscriberId}/export`,
        {
          headers: { Authorization: this.authHeader },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to export subscriber: ${response.status}`);
      }

      return await response.json();
    });
  }

  /**
   * Get bounce records for a subscriber (direct API call)
   */
  async $getSubscriberBounces(
    subscriberId: number,
  ): Promise<{ data: ListmonkBounce[] }> {
    return await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/${subscriberId}/bounces`,
        {
          headers: { Authorization: this.authHeader },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to get subscriber bounces: ${response.status}`);
      }

      return await response.json();
    });
  }

  /**
   * Update subscriber list memberships (direct API call)
   */
  async $updateSubscriberLists(
    options: UpdateSubscriberListsOptions,
  ): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(`${this.baseUrl}/api/subscribers/lists`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify({
          action: options.action,
          target_list_ids: options.listIds,
          ids: options.subscriberIds,
          status: options.action === 'add' ? options.status : undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update subscriber lists: ${response.status} ${errorText}`,
        );
      }
    });
  }

  /**
   * Blocklist subscribers (direct API call)
   */
  async $blocklistSubscribers(subscriberIds: number[]): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/blocklist`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          body: JSON.stringify({ ids: subscriberIds }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to blocklist subscribers: ${response.status} ${errorText}`,
        );
      }
    });
  }

  /**
   * Delete subscribers (direct API call)
   */
  async $deleteSubscribers(subscriberIds: number[]): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(`${this.baseUrl}/api/subscribers`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify({ ids: subscriberIds }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete subscribers: ${response.status} ${errorText}`,
        );
      }
    });
  }

  /**
   * Delete subscribers by query (direct API call)
   */
  async $deleteSubscribersByQuery(query: string): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(
        `${this.baseUrl}/api/subscribers/query/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          body: JSON.stringify({ query }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete subscribers by query: ${response.status} ${errorText}`,
        );
      }
    });
  }

  /**
   * Create a subscriber using the public API (direct API call)
   */
  async $createPublicSubscription(
    email: string,
    listUuids: string[],
    name?: string,
  ): Promise<void> {
    await limiter.schedule(async () => {
      const response = await fetch(`${this.baseUrl}/api/public/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          list_uuids: listUuids,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create public subscription: ${response.status} ${errorText}`,
        );
      }
    });
  }

  /**
   * Sync a single user subscription with two-list logic:
   * - Always subscribe to default list (ID: 3)
   * - Only subscribe to newsletter list (ID: 2) if subscribeToEmails is true
   */
  async syncUserSubscription(
    subscriber: ListmonkSubscriber,
    subscribeToEmails: boolean,
    userId: string,
  ): Promise<void> {
    const existingSubscriber = await this.getSubscriberByUserId(userId);
    const defaultListId = LISTMONK_CONFIG.defaultListId;
    const newsletterListId = LISTMONK_CONFIG.newsletterListId;

    // Step 1: Ensure user exists in Listmonk (create or update)
    const shouldUpdate =
      existingSubscriber &&
      (existingSubscriber.email !== subscriber.email ||
        existingSubscriber.name !== subscriber.name ||
        !equals(existingSubscriber.attribs, subscriber.attribs));

    if (!existingSubscriber || shouldUpdate) {
      // Set lists based on subscription preferences
      const lists = [defaultListId];
      if (subscribeToEmails && newsletterListId) {
        lists.push(newsletterListId);
      }

      // Status is always 'enabled' for NameFi users
      await this.upsertSubscriber({
        ...subscriber,
        status: 'enabled',
        lists,
      });
      logger.debug(
        { userId, email: subscriber.email, lists },
        'Created/updated subscriber with appropriate lists',
      );
      return;
    }

    // Step 2: Update list memberships for existing subscriber
    const listsToAdd: number[] = [];
    const listsToRemove: number[] = [];

    // Always ensure user is in default list
    if (
      !existingSubscriber.lists?.some(
        (list) =>
          list.id === defaultListId && list.subscription_status === 'confirmed',
      )
    ) {
      listsToAdd.push(defaultListId);
    }

    // Handle newsletter list based on subscribeToEmails flag
    if (newsletterListId) {
      const isInNewsletterList = existingSubscriber.lists?.some(
        (list) =>
          list.id === newsletterListId &&
          list.subscription_status === 'confirmed',
      );

      if (subscribeToEmails && !isInNewsletterList) {
        listsToAdd.push(newsletterListId);
      } else if (!subscribeToEmails && isInNewsletterList) {
        listsToRemove.push(newsletterListId);
      }
    }

    // Apply list changes
    if (listsToAdd.length > 0) {
      await this.$updateSubscriberLists({
        action: 'add',
        listIds: listsToAdd,
        subscriberIds: [existingSubscriber.id],
        status: 'confirmed',
      });
      logger.debug(
        { userId, email: existingSubscriber.email, listsAdded: listsToAdd },
        'Added subscriber to lists',
      );
    }

    if (listsToRemove.length > 0) {
      await this.$updateSubscriberLists({
        action: 'unsubscribe',
        listIds: listsToRemove,
        subscriberIds: [existingSubscriber.id],
      });
      logger.debug(
        {
          userId,
          email: existingSubscriber.email,
          listsRemoved: listsToRemove,
        },
        'Removed subscriber from lists',
      );
    }

    if (listsToAdd.length === 0 && listsToRemove.length === 0) {
      logger.debug(
        { userId, email: existingSubscriber.email },
        'No list membership changes needed',
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      return await limiter.schedule(async () => {
        const response = await fetch(`${this.baseUrl}/api/health`, {
          headers: {
            Authorization: this.authHeader,
          },
        });

        return response.ok;
      });
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Listmonk');
      return false;
    }
  }
}

/**
 * Shared, lazily-constructed Listmonk client backed by {@link LISTMONK_CONFIG}.
 * Built once on first access and reused across all consumers.
 */
export const getListmonkClient = lazy(
  () => new ListmonkClient(LISTMONK_CONFIG),
);
