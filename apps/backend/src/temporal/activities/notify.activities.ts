import { db, usersTable, type PaymentProvider } from '@namefi-astra/db';
import { eq } from 'drizzle-orm';
import { type SendMailInput, sendMail } from '../../mail/mail-client';
import { privyClient } from '../../trpc/utils';
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
import { Context } from '@temporalio/activity';
import { logger } from '#lib/logger';
import { GeneralStyledNotification } from '../../mail/templates/general-styled-notification';
import * as workflow from '@temporalio/workflow';
import { getStripePaymentMethodPublicIdentifier } from './payment.activities';
import { resolve } from '@namefi-astra/utils';

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

/**
 * @deprecated
 */
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
        )}.\nVisit https://${hostname}/user/orders/${orderId} to see more details.`,
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
  chargedAmountInUsdCents: number;
  paymentMethodCharged: PaymentProvider;
  /**
   * @remarks
   * This is either the last 4 digits of the card number or the wallet address for crypto payments.
   */
  paymentMethodIdentifier: string;
  refund?: {
    amountInUsd: number;
    status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  };
};

export async function getProcessedOrderEmail({
  orderId,
  recipientName,
  recipientEmail,
  items,
  chargedAmountInUsdCents,
  paymentMethodCharged,
  paymentMethodIdentifier: paymentMethodIdentifierRaw,
  refund,
}: GetProcessedOrderEmailInput) {
  const successfulItems = items.filter((item) => item.status === 'SUCCEEDED');
  const failedItems = items.filter((item) => item.status === 'FAILED');
  const processingItems = items.filter((item) => item.status === 'PROCESSING');

  const poweredByNamefiDomain = await determineHostnameFromCartItems(items);

  const successfulRegistrations = successfulItems.filter(
    (item) => item.type === 'REGISTER',
  );

  let subject: string;
  if (failedItems.length > 0 && successfulItems.length > 0) {
    subject = `[Namefi] Order ${orderId} - Partially Processed`;
  } else if (failedItems.length > 0) {
    subject = `[Namefi] Order ${orderId} - Processing Failed`;
  } else if (processingItems.length > 0) {
    subject = `[Namefi] Order ${orderId} - Still Processing`;
  } else if (successfulRegistrations.length > 0) {
    if (successfulRegistrations.length === 1) {
      const domainName = successfulRegistrations[0].normalizedDomainName;
      subject = `[Namefi] Congratulations! Your domain ${domainName} is ready!`;
    } else {
      subject = `[Namefi] Congratulations! Your ${successfulRegistrations.length} domains are ready!`;
    }
  } else {
    subject = `[Namefi] Order ${orderId} - Successfully Processed`;
  }

  // Defensive: avoid SMTP header injection via CRLF in subject.
  subject = subject.replaceAll(/\r|\n/g, ' ');

  const paymentMethodDisplayName =
    displayNameForPaymentMethod(paymentMethodCharged);
  let paymentMethodIdentifier = paymentMethodIdentifierRaw;
  if (paymentMethodCharged === 'STRIPE') {
    const [_, last4] = await resolve(
      getStripePaymentMethodPublicIdentifier({
        paymentMethodId: paymentMethodIdentifierRaw,
      }),
    );
    if (last4) {
      paymentMethodIdentifier = `....${last4}`;
    }
  } else {
    paymentMethodIdentifier = abbreviateEvmAddress(paymentMethodIdentifierRaw);
  }

  const content = React.createElement(ProcessedOrderReport, {
    orderId,
    recipientName,
    recipientEmail,
    items,
    chargedAmountInUsdCents,
    paymentMethodCharged: paymentMethodDisplayName,
    paymentMethodIdentifier,
    refund,
    poweredByNamefiDomain,
  });

  const html = await render(content);
  const plainText = await render(content, { plainText: true });

  return {
    subject,
    content: { html, plain: plainText },
  };
}

export async function notifyUserOrderProcessed(
  input: GetProcessedOrderEmailInput,
) {
  const { subject, content } = await getProcessedOrderEmail(input);

  await sendEmailOrThrow({
    to: [input.recipientEmail],
    subject,
    content,
  });
}

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

  const { subdomains = [] } = groupBy(({ levels }) => {
    if (levels.length === 3) {
      return 'subdomains';
    }
    return 'other';
  }, itemsWithLevels);

  if (subdomains.length !== items.length) {
    return 'namefi.io';
  }

  const subdomainsGroupedByParentDomain = groupBy(
    prop('parentDomain'),
    subdomains,
  );

  if (Object.keys(subdomainsGroupedByParentDomain).length === 1) {
    const parentDomain = Object.keys(subdomainsGroupedByParentDomain)[0];
    const poweredByNamefi3pDomains = await getPoweredByNamefi3PDomains();
    if (
      poweredByNamefi3pDomains.includes(parentDomain as NamefiNormalizedDomain)
    ) {
      return parentDomain;
    }
  }

  return 'namefi.io';
}

/**
 * Sends a styled email notification to a user
 *
 * @param userId - The user ID to send notification to
 * @param messageMarkdown - Content of the message in Markdown format
 * @param showGoToDashboard - Whether to show a dashboard link
 * @param title - Email title
 * @param subject - Optional email subject (defaults to title)
 * @returns Promise indicating success
 */

export async function sendStyledEmailNotificationForUser({
  userId,
  messageMarkdown,
  showGoToDashboard,
  title,
  subject,
}: {
  userId: string;
  messageMarkdown: string;
  showGoToDashboard: boolean;
  title: string;
  subject?: string;
}) {
  const ctx = Context.current();
  try {
    const userEmail = await maybeGetUserEmail(userId);
    if (!userEmail) {
      logger.error(`User ${userId} not found`);
      return { status: 'FAILED' };
    }
    logger.info(`Sending styled email to user ${userId} (${userEmail})`);

    const populatedTemplate = React.createElement(GeneralStyledNotification, {
      title,
      messageMarkdown,
      showGoToDashboard,
    });

    const html = await render(populatedTemplate, {
      pretty: false,
      plainText: false,
    });
    const plain = await render(populatedTemplate, {
      pretty: false,
      plainText: true,
    });

    await sendMail({
      to: [userEmail],
      bcc: [
        'customer-email-archive@d3serve.xyz',
        'sami@d3serve.xyz',
        'zzn@d3serve.xyz',
      ],
      subject: subject || title,
      content: {
        html,
        plain,
      },
    });

    ctx.log.info(
      `Successfully sent styled email to user ${userId} (${userEmail})`,
    );
    return { status: 'SUCCESS' };
  } catch (error: any) {
    ctx.log.error(
      `Failed to send styled email to user ${userId}: ${error.message}`,
      error.stack,
    );
    throw new workflow.ApplicationFailure(
      `Email delivery failed: ${error.message}`,
    );
  }
}

export async function sendStyledEmailNotification({
  to,
  bcc,
  cc,
  replyTo,
  messageMarkdown,
  showGoToDashboard,
  title,
  subject,
}: {
  to: string[];
  bcc?: string[];
  cc?: string[];
  replyTo?: string[];
  messageMarkdown: string;
  showGoToDashboard: boolean;
  title: string;
  subject?: string;
}) {
  const ctx = Context.current();
  try {
    const populatedTemplate = React.createElement(GeneralStyledNotification, {
      title,
      messageMarkdown,
      showGoToDashboard,
    });

    const html = await render(populatedTemplate, {
      pretty: false,
      plainText: false,
    });
    const plain = await render(populatedTemplate, {
      pretty: false,
      plainText: true,
    });

    await sendMail({
      to,
      bcc: [
        'customer-email-archive@d3serve.xyz',
        'sami@d3serve.xyz',
        'zzn@d3serve.xyz',
        ...(bcc ?? []),
      ],
      cc: cc ?? [],
      subject: subject || title,
      replyTo,
      content: {
        html,
        plain,
      },
    });

    ctx.log.info(`Successfully sent styled email to ${to.join(', ')}`);
    return { status: 'SUCCESS' };
  } catch (error: any) {
    ctx.log.error(
      `Failed to send styled email to ${to.join(', ')}: ${error.message}`,
      error.stack,
    );
    throw new workflow.ApplicationFailure(
      `Email delivery failed: ${error.message}`,
    );
  }
}

function displayNameForPaymentMethod(paymentMethod: PaymentProvider) {
  switch (paymentMethod) {
    case 'NFSC_BASE':
      return '$NFSC (Base)';
    case 'NFSC_ETHEREUM':
      return '$NFSC (Ethereum)';
    case 'NFSC_ETHEREUM_SEPOLIA':
      return '$NFSC (Ethereum Sepolia)';
    case 'STRIPE':
      return 'Credit Card';
  }
}
function abbreviateEvmAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
