import { db, usersTable } from '@namefi-astra/db';
import { getSubDomainAndParentDomainFromNormalizedDomainName } from '@namefi-astra/utils';
import { eq } from 'drizzle-orm';
import { type SendMailInput, sendMail } from '../../mail/mail-client';
import { privyClient } from '../../trpc/utils';

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

  // TODO(Luis): Add check to validate that the parent domain is an allowed third-party origin
  const parentDomains = new Set<string>();

  for (const succeededItem of succeededItems) {
    const { parentDomain } =
      getSubDomainAndParentDomainFromNormalizedDomainName(
        succeededItem.normalizedDomainName,
      );
    parentDomains.add(parentDomain);
  }

  for (const failedItem of failedItems) {
    const { parentDomain } =
      getSubDomainAndParentDomainFromNormalizedDomainName(
        failedItem.normalizedDomainName,
      );
    parentDomains.add(parentDomain);
  }
  const hostname =
    parentDomains.size === 1
      ? [...parentDomains.values()].at(0)
      : 'poweredby.namefi.io';

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

export type NotifyActivities = {
  sendEmailOrThrow: typeof sendEmailOrThrow;
  getUserEmailOrThrow: typeof getUserEmailOrThrow;
  getOrderProcessedEmailContent: typeof getOrderProcessedEmailContent;
};
