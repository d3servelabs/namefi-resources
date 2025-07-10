import { db, usersTable, type PaymentProvider } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { type SendMailInput, sendMail } from '../../mail/mail-client';
import { privyClient } from '../../trpc/utils';
import { config } from '#lib/env';
import {
  ProcessedOrderReport,
  type ProcessedOrderItem,
} from '../../mail/templates/processed-order-report';
import React from 'react';
import { render } from '@react-email/components';
import { getDomainLevels } from '#lib/get-domain-levels';
import { groupBy, map, prop } from 'ramda';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';

export async function maybeGetUserEmail(
  userId: string,
): Promise<string | undefined> {
  const user = await db.query.usersTable.findFirst({
    where: (users, { eq }) => eq(users.id, userId),
  });
  if (!user) {
    return undefined;
  }
  const privyUser = await privyClient.getUserById(user.privyUserId);
  if (!privyUser) {
    return undefined;
  }
  const primaryEmail = privyUser.email;
  if (primaryEmail) {
    return primaryEmail.address;
  }
  const linkedAccounts = privyUser.linkedAccounts;
  for (const linkedAccount of linkedAccounts) {
    if (linkedAccount.type === 'email') {
      return linkedAccount.address;
    }
  }
  return undefined;
}

export async function getUserEmailOrThrow(userId: string) {
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, userId),
    columns: {
      primaryEmail: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (!user.primaryEmail) {
    // TODO: (sid) remove this after merging guest checkout
    throw new Error('User has no primary email');
  }

  return user.primaryEmail;
}

type SendEmailOrThrowInput = Pick<SendMailInput, 'to' | 'subject' | 'content'>;

export async function sendEmailOrThrow({
  to,
  subject,
  content,
}: SendEmailOrThrowInput) {
  await sendMail({
    to,
    subject,
    content,
  });
}

type GetOrderProcessedEmailContentInput = {
  orderId: string;
  succeededItems: { normalizedDomainName: string }[];
  failedItems: { normalizedDomainName: string }[];
};

export async function getOrderProcessedEmailContent({
  orderId,
  succeededItems,
  failedItems,
}: GetOrderProcessedEmailContentInput) {
  const hasSucceededItems = succeededItems.length > 0;
  const hasFailedItems = failedItems.length > 0;

  if (!(hasSucceededItems || hasFailedItems)) {
    throw new Error('Missing succeededItems and failedItems');
  }

  const hasMultipleSucceededDomains = succeededItems.length > 1;
  const hasMultipleFailedDomains = failedItems.length > 1;

  const hostname = await determineHostnameFromCartItems([
    ...succeededItems,
    ...failedItems,
  ]);

  // some succeeded, some failed
  if (hasSucceededItems && hasFailedItems) {
    return {
      content: `${hasMultipleFailedDomains ? 'Some items' : 'An item'} in your recent order failed to process.\nYour new domain${hasMultipleSucceededDomains ? 's' : ''}: ${succeededItems.map((item) => item.normalizedDomainName).join(', ')}.\nFailed to process: ${failedItems
        .map((item) => item.normalizedDomainName)
        .join(
          ', ',
        )}.\nVisit https://${hostname}/orders/${orderId} to see more details.`,
    };
  }

  // all succeeded
  if (!hasFailedItems) {
    return {
      content: hasMultipleSucceededDomains
        ? `All items in your recent order were processed successfully.\nYour new domains: ${succeededItems.map((item) => item.normalizedDomainName).join(', ')}.\nVisit https://${hostname}/orders/${orderId} to see more details.`
        : `The domain (${succeededItems[0].normalizedDomainName}) in your recent order was processed successfully.\nVisit https://${hostname}/orders/${orderId} to see more details.`,
    };
  }

  // all failed
  return {
    content: hasMultipleFailedDomains
      ? `The items in your recent order failed to process.\nFailed to process: ${failedItems.map((item) => item.normalizedDomainName).join(', ')}.\nVisit https://${hostname}/orders/${orderId} to see more details.`
      : `The domain (${failedItems[0].normalizedDomainName}) in your recent order failed to process.\nVisit https://${hostname}/orders/${orderId} to see more details.`,
  };
}

type GetProcessedOrderEmailInput = {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  items: ProcessedOrderItem[];
  chargedAmountInUsd: number;
  paymentMethodCharged: PaymentProvider;
  /**
   * @remarks
   * This is either the last 4 digits of the card number or the wallet address for crypto payments.
   */
  paymentMethodIdentifier: string;
  refundAmountInUsd?: number;
  refundStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
};

export async function getProcessedOrderEmail({
  orderId,
  recipientName,
  recipientEmail,
  items,
  chargedAmountInUsd,
  paymentMethodCharged,
  paymentMethodIdentifier,
  refundAmountInUsd,
  refundStatus,
}: GetProcessedOrderEmailInput) {
  const successfulItems = items.filter((item) => item.status === 'SUCCESS');
  const failedItems = items.filter((item) => item.status === 'FAILED');

  const hostname = await determineHostnameFromCartItems(items);

  const ctaLink = `https://${hostname}/orders/${orderId}`;

  const subject =
    failedItems.length > 0 && successfulItems.length > 0
      ? `[Namefi] Order ${orderId} - Partially Processed`
      : failedItems.length > 0
        ? `[Namefi] Order ${orderId} - Processing Failed`
        : `[Namefi] Order ${orderId} - Successfully Processed`;

  const content = React.createElement(ProcessedOrderReport, {
    orderId,
    recipientName,
    recipientEmail,
    items,
    chargedAmountInUsd,
    paymentMethodCharged,
    paymentMethodIdentifier,
    refundAmountInUsd,
    refundStatus,
    ctaLink,
  });

  const html = await render(content);
  const plainText = await render(content, { plainText: true });

  return {
    subject,
    content: { html, plain: plainText },
  };
}

export type NotifyActivities = {
  sendEmailOrThrow: typeof sendEmailOrThrow;
  getUserEmailOrThrow: typeof getUserEmailOrThrow;
  getOrderProcessedEmailContent: typeof getOrderProcessedEmailContent;
  getProcessedOrderEmail: typeof getProcessedOrderEmail;
};

// Extracted helper (place near the top of the file, e.g. after imports)
async function determineHostnameFromCartItems(
  items: { normalizedDomainName: string }[],
): Promise<string> {
  const itemsWithLevels = map((item) => {
    const { levels, parentDomain } = getDomainLevels(
      item.normalizedDomainName as NamefiNormalizedDomain,
    );
    return { item, levels, parentDomain: parentDomain ?? '' };
  }, items);

  const { thirdLevel = [] } = groupBy(({ levels }) => {
    if (levels.length === 3) {
      return 'thirdLevel';
    }
    return 'other';
  }, itemsWithLevels);

  if (thirdLevel.length !== items.length) {
    return config.APP_URL;
  }

  const thirdLevelGroupedByParentDomain = groupBy(
    prop('parentDomain'),
    thirdLevel,
  );

  if (Object.keys(thirdLevelGroupedByParentDomain).length === 1) {
    const parentDomain = Object.keys(thirdLevelGroupedByParentDomain)[0];
    const poweredByNamefi3pDomains = await getPoweredByNamefi3PDomains();
    if (
      poweredByNamefi3pDomains.includes(parentDomain as NamefiNormalizedDomain)
    ) {
      return parentDomain;
    }
  }

  return config.APP_URL;
}
