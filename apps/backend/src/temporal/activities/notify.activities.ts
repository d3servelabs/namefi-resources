import {
  db,
  ordersTable,
  usersTable,
  type PaymentProvider,
} from '@namefi-astra/db';
import type {
  NotificationPriority,
  NotificationRelatedResource,
} from '@namefi-astra/common/shared-schemas';
import { eq } from 'drizzle-orm';
import { tryCreateInAppNotification } from '#lib/notifications/try-create-notification';
import { type SendMailInput, sendMail } from '../../mail/mail-client';
import { privyClient } from '../../trpc/utils';
import {
  ProcessedOrderReport,
  type ProcessedOrderItem,
} from '../../mail/templates/processed-order-report';
import { NfscTopUpConfirmation } from '../../mail/templates/nfsc-topup-confirmation';
import React from 'react';
import { render } from '@react-email/components';
import { groupBy, map, prop } from 'ramda';
import {
  getChain,
  parseDomainName,
  type NamefiNormalizedDomain,
} from '@namefi-astra/utils';
import { getPoweredByNamefi3PDomains } from '#lib/namefi-registry';
import { Context } from '@temporalio/activity';
import { logger } from '#lib/logger';
import { GeneralStyledNotification } from '../../mail/templates/general-styled-notification';
import * as workflow from '@temporalio/workflow';
import { getStripePaymentMethodPublicIdentifier } from './payment.activities';
import { resolve } from '@namefi-astra/utils';
import { domainToUnicode } from 'node:url';
import {
  buildEmailAnalyticsUrl,
  type EmailAnalyticsPayload,
} from '../../mail/components/email-tracking';
import { config } from '#lib/env';
import { randomUUID } from 'node:crypto';

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
  paymentMethodIdentifier?: string;
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

  const successfulImports = successfulItems.filter(
    (item) => item.type === 'IMPORT',
  );
  const successfulRenewals = successfulItems.filter(
    (item) => item.type === 'RENEW',
  );

  let subject: string;
  if (failedItems.length > 0 && successfulItems.length > 0) {
    subject = '[Namefi] Your Order Needs Attention';
  } else if (failedItems.length > 0) {
    subject = '[Namefi] We Need Your Attention';
  } else if (processingItems.length > 0) {
    subject = '[Namefi] Your Order is Being Processed';
  } else if (successfulImports.length > 0) {
    if (successfulImports.length === 1) {
      const domainName = domainToUnicode(
        successfulImports[0].normalizedDomainName,
      );
      subject = `[Namefi] Welcome to Namefi, ${domainName}!`;
    } else {
      subject = '[Namefi] Your Domains Have Arrived!';
    }
  } else if (successfulRenewals.length > 0) {
    subject = '[Namefi] Your Domain Renewal is Complete';
  } else if (successfulRegistrations.length > 0) {
    if (successfulRegistrations.length === 1) {
      const domainName = domainToUnicode(
        successfulRegistrations[0].normalizedDomainName,
      );
      subject = `[Namefi] ${domainName} is Yours!`;
    } else {
      subject = '[Namefi] Your New Domains Are Ready!';
    }
  } else {
    subject = '[Namefi] An Update About Your Recent Order';
  }

  // Defensive: avoid SMTP header injection via CRLF in subject.
  subject = subject.replaceAll(/\r|\n/g, ' ');

  const paymentMethodDisplayName =
    displayNameForPaymentMethod(paymentMethodCharged);
  let paymentMethodIdentifier = paymentMethodIdentifierRaw ?? '';
  if (paymentMethodIdentifierRaw) {
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
      paymentMethodIdentifier = abbreviateEvmAddress(
        paymentMethodIdentifierRaw,
      );
    }
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
    trackingUrl: await maybeGetOrderFinishedAnalyticsUrl(),
  });

  const html = await render(content);
  const plainText = await render(content, { plainText: true });

  return {
    subject,
    content: { html, plain: plainText },
  };
}

async function maybeGetOrderFinishedAnalyticsUrl(): Promise<string | null> {
  if (!config.EMAIL_ANALYTICS_URL) {
    return null;
  }

  if (config.EMAIL_ANALYTICS_URL) {
    try {
      const payload = {
        nonce: randomUUID(),
        type: 'order_ready_count_only',
      } satisfies EmailAnalyticsPayload;
      const analyticsUrlResult = await buildEmailAnalyticsUrl({
        trackUrl: config.EMAIL_ANALYTICS_URL,
        data: payload,
      });
      return analyticsUrlResult.url;
    } catch (error) {
      logger.trace({ error }, 'Failed to build analytics URL');
    }
  }
  return null;
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

  // Mirror the email in the in-app inbox. The order rows carry the userId;
  // look it up here so callers don't need to thread one more parameter.
  const order = await db.query.ordersTable.findFirst({
    where: eq(ordersTable.id, input.orderId),
    columns: { userId: true },
  });

  if (!order) return;

  await tryCreateInAppNotification({
    userId: order.userId,
    title: subject,
    body: buildProcessedOrderInAppBody(input),
    bodyType: 'markdown',
    // Orders are the user's intentional purchases — surface them audibly
    // whether they succeeded or partially failed.
    priority: 'high',
    relatedResources: [
      { type: 'order', identifier: input.orderId },
      ...input.items.map((item) => ({
        type: 'domain' as const,
        identifier: item.normalizedDomainName,
      })),
    ],
    metadata: { source: 'activity:notifyUserOrderProcessed' },
  });
}

function buildProcessedOrderInAppBody(
  input: GetProcessedOrderEmailInput,
): string {
  const succeeded = input.items.filter((i) => i.status === 'SUCCEEDED');
  const failed = input.items.filter((i) => i.status === 'FAILED');
  const processing = input.items.filter((i) => i.status === 'PROCESSING');

  const sections: string[] = [];
  const bullets = (names: string[]) => names.map((n) => `- ${n}`).join('\n');

  if (succeeded.length > 0) {
    sections.push(
      `**Completed**\n${bullets(succeeded.map((i) => i.normalizedDomainName))}`,
    );
  }
  if (processing.length > 0) {
    sections.push(
      `**Still processing**\n${bullets(processing.map((i) => i.normalizedDomainName))}`,
    );
  }
  if (failed.length > 0) {
    sections.push(
      `**Needs attention**\n${bullets(failed.map((i) => i.normalizedDomainName))}`,
    );
  }
  if (input.refund) {
    sections.push(
      `Refund ${input.refund.status.toLowerCase()}: **$${input.refund.amountInUsd.toFixed(2)}**`,
    );
  }
  return sections.join('\n\n');
}

type NotifyUserNfscTopUpProcessedInput = {
  orderId: string;
  recipientName: string;
  recipientEmail: string;
  /** NFSC token amount credited, as a decimal string (1 USD = 1 NFSC). */
  nfscAmount: string;
  /** Amount charged, in USD cents. */
  chargedAmountInUsdCents: number;
  paymentMethodCharged: PaymentProvider;
  /**
   * Stripe payment method id or wallet address — resolved to a public-safe
   * identifier (card last-4 or abbreviated address) before rendering.
   */
  paymentMethodIdentifier?: string;
  recipientWalletAddress: string;
  chainId: number;
  status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  refund?: {
    amountInUsd: number;
    status: 'SUCCEEDED' | 'FAILED' | 'PROCESSING';
  };
};

/**
 * Send the NFSC top-up confirmation email. Mirrors `notifyUserOrderProcessed`
 * but for the non-domain NFSC top-up flow: resolves a public-safe payment
 * identifier, maps the chain id to a human-readable network name, renders the
 * `NfscTopUpConfirmation` template, and sends it.
 */
export async function notifyUserNfscTopUpProcessed(
  input: NotifyUserNfscTopUpProcessedInput,
) {
  const {
    orderId,
    recipientName,
    recipientEmail,
    nfscAmount,
    chargedAmountInUsdCents,
    paymentMethodCharged,
    paymentMethodIdentifier: paymentMethodIdentifierRaw,
    recipientWalletAddress,
    chainId,
    status,
    refund,
  } = input;

  const paymentMethodDisplayName =
    displayNameForPaymentMethod(paymentMethodCharged);
  // Start empty so a failed Stripe last-4 lookup cannot fall back to the raw
  // payment-method id and leak it into the email body.
  let paymentMethodIdentifier = '';
  if (paymentMethodIdentifierRaw) {
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
      paymentMethodIdentifier = abbreviateEvmAddress(
        paymentMethodIdentifierRaw,
      );
    }
  }

  const chainName = getChain(chainId)?.name ?? `Chain ${chainId}`;

  const content = React.createElement(NfscTopUpConfirmation, {
    orderId,
    recipientName,
    recipientEmail,
    nfscAmount,
    chargedAmountInUsdCents,
    paymentMethodCharged: paymentMethodDisplayName,
    paymentMethodIdentifier,
    recipientWalletAddress,
    chainName,
    status,
    refund,
    // NFSC top-ups are not powered-by-namefi scoped — always canonical.
    poweredByNamefiDomain: 'namefi.io',
  });

  const html = await render(content);
  const plainText = await render(content, { plainText: true });

  let subject =
    status === 'SUCCEEDED'
      ? '[Namefi] Your NFSC top-up is complete'
      : status === 'PROCESSING'
        ? '[Namefi] Your NFSC top-up is being processed'
        : '[Namefi] Your NFSC top-up needs attention';
  // Defensive: avoid SMTP header injection via CRLF in subject.
  subject = subject.replaceAll(/\r|\n/g, ' ');

  await sendEmailOrThrow({
    to: [recipientEmail],
    subject,
    content: { html, plain: plainText },
  });
}

// Extracted helper (place near the top of the file, e.g. after imports)
async function determineHostnameFromCartItems(
  items: { normalizedDomainName: string }[],
): Promise<string> {
  const itemsWithLevels = map((item) => {
    const parseResult = parseDomainName(
      item.normalizedDomainName as NamefiNormalizedDomain,
    );
    return {
      item,
      registryType: parseResult.valid ? parseResult.registryType : null,
      parentDomain: parseResult.valid ? parseResult.immediateParentDomain : '',
    };
  }, items);

  const { subdomains = [] } = groupBy(({ registryType }) => {
    if (registryType === 'subdomain') {
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
 * Optional carry payload that lets the caller drop a row in the in-app
 * notifications inbox alongside the email. Default behavior (when the
 * `inAppNotification` field is omitted) is to write the inbox row with
 * sensible defaults — pass `{ enabled: false }` to opt out for a
 * specific call. See `tryCreateInAppNotification` for failure semantics.
 */
export type InAppNotificationCarry = {
  enabled?: boolean;
  subtitle?: string;
  /**
   * Audibility for the in-app row — see `CreateNotificationInput.priority`.
   * Defaults to `'normal'`. Set `'high'` on the failure-side `notify()`
   * lambdas so the bell sounds for things the user should look at now.
   */
  priority?: NotificationPriority;
  relatedResources?: NotificationRelatedResource[];
  /** Override the `metadata.source` label. */
  source?: string;
};

/**
 * Sends a styled email notification to a user
 *
 * @param userId - The user ID to send notification to
 * @param messageMarkdown - Content of the message in Markdown format
 * @param showGoToDashboard - Whether to show a dashboard link
 * @param title - Email title
 * @param subject - Optional email subject (defaults to title)
 * @param inAppNotification - Optional payload to also surface the message
 *   in the user's in-app inbox. Defaults to enabled with no extra context.
 * @returns Promise indicating success
 */

export async function sendStyledEmailNotificationForUser({
  userId,
  messageMarkdown,
  showGoToDashboard,
  title,
  subject,
  inAppNotification,
}: {
  userId: string;
  messageMarkdown: string;
  showGoToDashboard: boolean;
  title: string;
  subject?: string;
  inAppNotification?: InAppNotificationCarry;
}) {
  const ctx = Context.current();
  try {
    const userEmail = await maybeGetUserEmail(userId);
    if (!userEmail) {
      logger.error(`User ${userId} not found`);
      return { status: 'FAILED' };
    }
    logger.debug(`Sending styled email to user ${userId} (${userEmail})`);

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

    if (inAppNotification?.enabled !== false) {
      await tryCreateInAppNotification({
        userId,
        title,
        subtitle: inAppNotification?.subtitle,
        body: messageMarkdown,
        bodyType: 'markdown',
        priority: inAppNotification?.priority,
        relatedResources: inAppNotification?.relatedResources ?? [],
        metadata: {
          source:
            inAppNotification?.source ??
            'activity:sendStyledEmailNotificationForUser',
        },
      });
    }

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

function displayNameForPaymentMethod(paymentMethod: PaymentProvider): string {
  switch (paymentMethod) {
    case 'NFSC_BASE':
      return '$NFSC (Base)';
    case 'NFSC_ETHEREUM':
      return '$NFSC (Ethereum)';
    case 'NFSC_ETHEREUM_SEPOLIA':
      return '$NFSC (Ethereum Sepolia)';
    case 'STRIPE':
      return 'Credit Card';
    case 'MPP':
      return 'MPP';
    case 'X402':
      return 'x402 (USDC)';
  }

  return paymentMethod;
}
function abbreviateEvmAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
