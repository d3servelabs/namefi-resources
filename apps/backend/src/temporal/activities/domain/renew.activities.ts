import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  resolve,
} from '@namefi-astra/utils';
import {
  DomainOwnershipOperation,
  RenewOption,
} from '@namefi-astra/registrars/lib/abstract-registrar/index';
import { differenceInDays } from 'date-fns';
import { isNotNil, and } from 'ramda';
import { sendMail } from '../../../mail/mail-client';
import {
  db,
  namefiNftTable,
  domainUserPreferencesTable,
  type PaymentProvider,
} from '@namefi-astra/db';
import { sldRegistrar } from '#lib/namefi-registry';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/lib/multi-year-pricing';
import React from 'react';
import { render } from '@react-email/components';
import {
  DomainUpcomingRenewal,
  type DomainUpcomingRenewalProps,
} from '../../../mail/templates/domain-upcoming-renewal';
import {
  DomainRenewReport,
  type DomainRenewReportProps,
} from '../../../mail/templates/domain-renew-report';
import {
  DomainRenewFailedToCharge,
  type DomainRenewFailedToChargeProps,
} from '../../../mail/templates/domain-renew-failed-to-charge';
import { calculateNextChargeDateAndAmount } from './helpers/calculateNextChargeDateAndAmount';
import { privyClient } from '../../../trpc/utils';
import { getPreferredPaymentMethodForNamefiUser } from '../payment.activities';
import type { WalletWithMetadata } from '@privy-io/server-auth';
import { eq, inArray, sql } from 'drizzle-orm';
import {
  RENEW_EARLY_BY_DAYS,
  SEND_RENEW_REMINDERS_THRESHOLD,
} from '../../../lib/env/consts';
import * as workflow from '@temporalio/workflow';
import { logger } from '#lib/logger';

export type DomainRenewInfo = {
  normalizedDomainName: NamefiNormalizedDomain;
  expirationTime: Date;
  autoRenewOption: RenewOption;
  chainId: number;
  walletAddress: ChecksumWalletAddress;
};

export type DomainRenewInfoWithPrice = DomainRenewInfo & {
  renewalPrice: number;
};

export type DomainsUpForRenewalWithUser = {
  domains: DomainRenewInfo[];
  userId: string;
};

export type DomainsUpForRenewalWithUserWithPrice = {
  domains: DomainRenewInfoWithPrice[];
  userId: string;
};

export async function getDomainsUpForRenewal() {
  const domains = await sldRegistrar.listAllDomains();
  const domainsWithUpcomingRenewal = domains.filter((domain) => {
    const daysToExpiration = differenceInDays(
      domain.expirationTime,
      new Date(),
    );
    return (
      daysToExpiration <= SEND_RENEW_REMINDERS_THRESHOLD &&
      daysToExpiration >= 0
    );
  });

  return domainsWithUpcomingRenewal;
}

export async function getUserDomainsWithAutoRenewOptionAndExpirationTime(
  userId: string,
  domainSummaries: Awaited<ReturnType<typeof getDomainsUpForRenewal>>,
): Promise<(DomainRenewInfo & { registrarKey: string })[]> {
  const domainSummariesMap = new Map<
    NamefiNormalizedDomain,
    (typeof domainSummaries)[number]
  >(domainSummaries.map((summary) => [summary.domainName, summary]));

  const userDomains = await _getUserDomainsWithAutoRenewOption(userId);

  const userDomainsWithExpirationTime = userDomains.map((domain) => {
    const domainSummary = domainSummariesMap.get(domain.normalizedDomainName);
    if (!domainSummary) {
      return null;
    }
    return {
      ...domain,
      registrarKey: domainSummary.registrarKey,
      expirationTime: domainSummary.expirationTime,
    };
  });

  return userDomainsWithExpirationTime.filter(isNotNil);
}

async function _getUserDomainsWithAutoRenewOption(
  userId: string,
): Promise<Omit<DomainRenewInfo, 'expirationTime'>[]> {
  const user = await db.query.usersTable.findFirst({
    where: (usersTable, { eq }) => eq(usersTable.id, userId),
  });
  const privyUserId = user?.privyUserId;
  if (!privyUserId) {
    return [];
  }
  const privyUserResponse = await resolve(privyClient.getUserById(privyUserId));
  if (privyUserResponse.failed) {
    logger.fatal(
      { privyUserId, userId, error: privyUserResponse.error },
      'Failed to get privy user',
    );
    throw workflow.ApplicationFailure.create({
      message: `Failed to get privy user for user ${userId} with privyUserId ${privyUserId}`,
      nonRetryable: true,
      cause: privyUserResponse.error,
    });
  }
  const privyUser = privyUserResponse.result;

  const evmWallets = (
    privyUser.linkedAccounts.filter(
      (linkedAccount) =>
        linkedAccount.type === 'wallet' &&
        linkedAccount.chainType === 'ethereum',
    ) as WalletWithMetadata[]
  )
    .map((wallet) => {
      const address = checksumWalletAddressSchema.safeParse(wallet.address);
      if (address.success) {
        return address.data;
      }
      logger.error(
        `received invalid wallet address ${wallet.address} from privy for privy userId: ${privyUser.id}`,
      );
      return null;
    })
    .filter(isNotNil);

  const userDomains = await db
    .select({
      normalizedDomainName: namefiNftTable.normalizedDomainName,
      autoRenewEnabled:
        sql<boolean>`coalesce(${domainUserPreferencesTable.autoRenewEnabled}, false)`.as(
          'autoRenewEnabled',
        ),
      chainId: namefiNftTable.chainId,
      ownerAddress: namefiNftTable.ownerAddress,
    })
    .from(namefiNftTable)
    .leftJoin(
      domainUserPreferencesTable,
      and(
        eq(
          namefiNftTable.normalizedDomainName,
          domainUserPreferencesTable.normalizedDomainName,
        ),
        eq(domainUserPreferencesTable.userId, userId),
      ),
    )
    .where(inArray(namefiNftTable.ownerAddress, evmWallets));

  const userDomainsWithAutoRenewOption = userDomains.map((domain) => ({
    ...domain,
    normalizedDomainName: domain.normalizedDomainName as NamefiNormalizedDomain,
    walletAddress: domain.ownerAddress as ChecksumWalletAddress,
    autoRenewOption: domain.autoRenewEnabled
      ? RenewOption.AUTOMATIC
      : RenewOption.MANUAL,
  }));

  return userDomainsWithAutoRenewOption;
}

export async function sendEmailNotificationForUpcomingRenew(
  userEmail: string,
  { domains, userId }: DomainsUpForRenewalWithUserWithPrice,
) {
  if (!userEmail) {
    logger.warn(
      { domains, userId },
      `Attempted to send email notification for upcoming renew but no email found for user ${userId}`,
    );
    return;
  }
  logger.info(
    { domains, userId, userEmail },
    'Sending email notification for upcoming renew',
  );
  const { nextChargeDate, nextChargeAmount } = calculateNextChargeDateAndAmount(
    domains
      .filter(({ autoRenewOption }) => autoRenewOption === 'AUTOMATIC')
      .map((domain) => ({
        expirationTime: domain.expirationTime,
        chargeAmount: domain.renewalPrice,
      })),
    RENEW_EARLY_BY_DAYS,
  );
  const preferredPaymentMethod = await getPreferredPaymentMethodForNamefiUser({
    namefiUserId: userId,
  });
  const populatedTemplate = React.createElement(DomainUpcomingRenewal, {
    recipientName: userEmail,
    userId,
    domainsRenewInfo: domains.map((domain) => ({
      domainNameLdh: domain.normalizedDomainName,
      expirationDate: new Date(domain.expirationTime),
      autoRenew: domain.autoRenewOption === 'AUTOMATIC',
      renewalPrice: { amount: domain.renewalPrice, currency: 'USD' },
      walletAddress: domain.walletAddress,
    })),
    recipientEmail: userEmail,
    nextChargeAmount: { amount: nextChargeAmount, currency: 'USD' },
    nextChargeDate,
    last4DigitsOfCreditCardToCharge: preferredPaymentMethod?.cardDetails?.last4,
  } satisfies DomainUpcomingRenewalProps);

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
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject: 'Domain Renew Notice',
    content: {
      html,
      plain,
    },
  });
}

export async function sendEmailNotificationForRenewResult({
  userId,
  domainLdhRenewFailed,
  domainLdhRenewSucceeded,
  paymentMethodCharged,
  paymentMethodIdentifier,
  refundAmountInUsd,
  refundStatus,
  chargedAmountInUsd,
  userEmail,
}: {
  userId: string;
  domainLdhRenewFailed: string[];
  domainLdhRenewSucceeded: string[];
  paymentMethodCharged: PaymentProvider;
  paymentMethodIdentifier: string;
  refundAmountInUsd: number | null | undefined;
  refundStatus: 'SUCCESS' | 'FAILED';
  chargedAmountInUsd: number;
  userEmail: string;
}) {
  const populatedTemplate = React.createElement(DomainRenewReport, {
    recipientName: userEmail,
    recipientUserId: userId,
    recipientEmail: userEmail,
    chargedAmountInUsd,
    domainLdhRenewFailed,
    domainLdhRenewSucceeded,
    paymentMethodCharged,
    paymentMethodIdentifier,
    refundAmountInUsd,
    refundStatus,
  } satisfies DomainRenewReportProps);

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
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject: 'Domain Renew Update',
    content: {
      html,
      plain,
    },
  });
}

export async function sendEmailNotificationForRenewFailedToCharge({
  chargeAmountInUsd,
  domainsToRenew,
  userId,
  userEmail,
}: {
  chargeAmountInUsd: number;
  domainsToRenew: string[];
  userId: string;
  userEmail: string;
}) {
  const populatedTemplate = React.createElement(DomainRenewFailedToCharge, {
    recipientName: userEmail,
    recipientUserId: userId,
    recipientEmail: userEmail,
    chargeAmountInUsd,
    domainsToRenew,
  } satisfies DomainRenewFailedToChargeProps);

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
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject: 'Domain Upcoming Renewal',
    content: {
      html,
      plain,
    },
  });
}

/**
 * Function to calculate the charge amount for a domain assuming
 * it's a renewal and with the *current provider* and extend for 1 year
 * @returns record with key as domainNameLdh and autoRenewPrice
 */
export async function getRenewPriceByDomain({
  normalizeDomainNameList,
}: {
  normalizeDomainNameList: NamefiNormalizedDomain[];
}): Promise<Record<NamefiNormalizedDomain, number>> {
  const domainChargeAmounts: Record<NamefiNormalizedDomain, number> = {};

  for (const domainLdh of normalizeDomainNameList) {
    const renewPricingDetails = await sldRegistrar.getDomainPrice(
      toPunycodeDomainName(domainLdh),
      DomainOwnershipOperation.RENEW,
    );
    const chargeAmount = await computeChargesInUsdOrThrow(
      renewPricingDetails,
      1,
    );
    domainChargeAmounts[domainLdh] = chargeAmount;
  }

  return domainChargeAmounts;
}
