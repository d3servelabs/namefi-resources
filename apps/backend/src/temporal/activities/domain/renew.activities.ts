import { getViemPublicClient } from '#lib/crypto/viem-clients';
import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  resolve,
} from '@namefi-astra/utils';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import { differenceInDays } from 'date-fns';
import {
  isNotNil,
  and,
  groupBy,
  prop,
  pluck,
  toPairs,
  pipe,
  toString as toStringR,
  fromPairs,
} from 'ramda';
import { sendMail } from '../../../mail/mail-client';
import {
  db,
  namefiNftOwnersView,
  domainUserPreferencesTable,
  type PaymentProvider,
} from '@namefi-astra/db';
import { sldRegistrar } from '#lib/namefi-registry';
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
import { ApplicationFailure } from '@temporalio/workflow';
import { logger } from '#lib/logger';
import { getDomainLevels } from '#lib/get-domain-levels';
import { nftIdFromDomainName } from '#lib/nft-hash';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { fromUnixTime } from 'date-fns';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { getDomainListInfo } from '#lib/namefi-registry';
import { computeChargesInUsdFromDomainAvailabilityInfo } from '@namefi-astra/registrars/multi-year-pricing';
import { config } from '#lib/env';

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

export async function getDomainsUpForRenewal(): Promise<
  {
    normalizedDomainName: NamefiNormalizedDomain;
    expirationTime: Date;
    registrarKey: string;
  }[]
> {
  // Get 3LD domains from NFT table
  const allNfts = await db
    .select({
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      chainId: namefiNftOwnersView.chainId,
    })
    .from(namefiNftOwnersView)
    .where(inArray(namefiNftOwnersView.chainId, config.ALLOWED_CHAINS));
  const allNftsMap = new Map<NamefiNormalizedDomain, number>(
    allNfts.map((nft) => [nft.normalizedDomainName, nft.chainId]),
  );

  // Get 2LD domains from registrar
  const sldDomains = await sldRegistrar.listAllDomains();
  const sldDomainsWithUpcomingRenewal = sldDomains.filter((domain) => {
    const daysToExpiration = differenceInDays(
      domain.expirationTime,
      new Date(),
    );
    return (
      allNftsMap.has(domain.domainName) && // Only include domains that are on an allowed chain and has NFT
      daysToExpiration <= SEND_RENEW_REMINDERS_THRESHOLD &&
      daysToExpiration >= 0
    );
  });

  // Filter for 3LD domains only
  const _3ldNfts = allNfts.filter((nft) => {
    const domainLevels = getDomainLevels(nft.normalizedDomainName);
    return domainLevels.levels.length === 3;
  });

  // Get expiration dates for 3LD domains
  const _3ldDomainsWithExpiration =
    await get3ldExpirationDatesForDomains(_3ldNfts);

  // Filter 3LD domains with upcoming renewal and valid expiration times
  const _3ldDomainsWithUpcomingRenewal = _3ldDomainsWithExpiration
    .filter((domain) => {
      if (!domain.expirationTime) return false;
      const daysToExpiration = differenceInDays(
        domain.expirationTime,
        new Date(),
      );
      return (
        daysToExpiration <= SEND_RENEW_REMINDERS_THRESHOLD &&
        daysToExpiration >= 0
      );
    })
    .map((domain) => ({
      normalizedDomainName: domain.normalizedDomainName,
      expirationTime: domain.expirationTime as Date, // We've already filtered out null values
      registrarKey: 'namefi-nft' as const,
    }));

  // Combine 2LD and 3LD domains
  const allDomainsWithUpcomingRenewal = [
    ...sldDomainsWithUpcomingRenewal.map((domain) => ({
      normalizedDomainName: domain.domainName,
      expirationTime: domain.expirationTime,
      registrarKey: domain.registrarKey,
    })),
    ..._3ldDomainsWithUpcomingRenewal,
  ];

  return allDomainsWithUpcomingRenewal;
}

export async function getUserWithEvmWallets() {
  const [privyUsers, users] = await Promise.all([
    privyClient.getUsers(),
    db.query.usersTable.findMany({
      columns: {
        id: true,
        privyUserId: true,
      },
    }),
  ]);

  const usersPrivyUserIdToNamefiUserIdMap = new Map<string, string>(
    users.map((user) => [user.privyUserId, user.id]),
  );

  const usersWithEvmWallets = privyUsers
    .map((privyUser) => {
      const wallets = privyUser.linkedAccounts
        .map((linkedAccount) => {
          if (
            linkedAccount.type !== 'wallet' ||
            linkedAccount.chainType !== 'ethereum'
          ) {
            return null;
          }
          return linkedAccount.address;
        })
        .filter(isNotNil);
      const userId = usersPrivyUserIdToNamefiUserIdMap.get(privyUser.id);
      if (!userId) {
        logger.fatal(
          { privyUserId: privyUser.id },
          'User has no namefi user id',
        );
        return null;
      }
      return {
        userId,
        privyUserId: privyUser.id,
        wallets,
      };
    })
    .filter(isNotNil);

  const walletToUserIdMap = new Map<
    string,
    (typeof usersWithEvmWallets)[number]
  >();
  for (const user of usersWithEvmWallets) {
    for (const wallet of user.wallets) {
      walletToUserIdMap.set(wallet, user);
    }
  }
  return {
    walletToUserIdMap,
    usersWithEvmWallets,
  };
}

export async function getDomainsUpForRenewalGroupedByOwner() {
  // Get both wallet-to-user mapping and domains that need renewal
  const [{ walletToUserIdMap }, domainsUpForRenewal] = await Promise.all([
    getUserWithEvmWallets(),
    getDomainsUpForRenewal(),
  ]);

  // Fetch NFT domain details for all domains up for renewal
  const nftDomains = await db
    .select({
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      ownerAddress: namefiNftOwnersView.ownerAddress,
      chainId: namefiNftOwnersView.chainId,
    })
    .from(namefiNftOwnersView)
    .where(
      inArray(
        namefiNftOwnersView.normalizedDomainName,
        domainsUpForRenewal.map((domain) => domain.normalizedDomainName),
      ),
    );

  // Create a map of domain name to NFT domain details for faster lookups
  const domainNftMap = new Map<
    NamefiNormalizedDomain,
    (typeof nftDomains)[number]
  >(
    nftDomains.map((domain) => [
      domain.normalizedDomainName as NamefiNormalizedDomain,
      domain,
    ]),
  );

  // Get user preferences for auto-renewal for all relevant domains and users
  const domainUserPreferencesMap = await _getDomainUserPreferencesMap(
    pluck('normalizedDomainName', domainsUpForRenewal),
  );

  // Process each domain to add owner details and auto-renewal preferences
  const domainsUpForRenewalWithOwnerDetails = domainsUpForRenewal.map(
    (domain) => {
      // Get NFT details for this domain
      const domainNft = domainNftMap.get(domain.normalizedDomainName);
      if (!domainNft) {
        logger.fatal(
          { domainName: domain.normalizedDomainName },
          'Domain not found in nftDomains',
        );
        return null;
      }

      // Get user details for the domain owner
      const user = walletToUserIdMap.get(domainNft.ownerAddress);
      if (!user) {
        logger.fatal(
          {
            domainName: domain.normalizedDomainName,
            nftDomain: domainNft,
          },
          'User not found in walletToUserIdMap',
        );
        return null;
      }

      // Determine auto-renewal preference for this domain
      const domainUserPreferences =
        domainUserPreferencesMap[domain.normalizedDomainName];

      let autoRenewOption: RenewOption = RenewOption.MANUAL;
      if (domainUserPreferences && domainUserPreferences.length > 0) {
        const domainUserPreference = domainUserPreferences.find(
          (preference) => preference.userId === user.userId,
        );
        autoRenewOption = domainUserPreference?.autoRenewEnabled
          ? RenewOption.AUTOMATIC
          : RenewOption.MANUAL;
      }

      // Return complete domain info with owner details and preferences
      return {
        normalizedDomainName: domain.normalizedDomainName,
        walletAddress: domainNft.ownerAddress as ChecksumWalletAddress,
        expirationTime: domain.expirationTime,
        autoRenewOption,
        chainId: domainNft.chainId,
        registrarKey: domain.registrarKey,
        userId: user.userId,
        privyUserId: user.privyUserId,
      } satisfies DomainRenewInfo & {
        userId: string;
        privyUserId: string;
        registrarKey: string;
      };
    },
  );

  // Group all domains by user ID and filter out any null entries
  return groupBy(
    prop('userId'),
    domainsUpForRenewalWithOwnerDetails.filter(isNotNil),
  );
}

/**
 * Get domain user preferences for a set of domains and users
 * @param domainNames - The domain names to get preferences for
 * @returns A map of domain name to user preferences
 */
async function _getDomainUserPreferencesMap(
  domainNames: NamefiNormalizedDomain[],
) {
  // Get user preferences for auto-renewal for all relevant domains and users
  const domainUserPreferences = await db
    .select({
      normalizedDomainName: domainUserPreferencesTable.normalizedDomainName,
      autoRenewEnabled: domainUserPreferencesTable.autoRenewEnabled,
      userId: domainUserPreferencesTable.userId,
    })
    .from(domainUserPreferencesTable)
    .where(
      inArray(domainUserPreferencesTable.normalizedDomainName, domainNames),
    );

  // Group preferences by domain name for easier access
  return groupBy(prop('normalizedDomainName'), domainUserPreferences);
}

export async function getUserDomainsWithAutoRenewOptionAndExpirationTime(
  userId: string,
  domainSummaries: Awaited<ReturnType<typeof getDomainsUpForRenewal>>,
): Promise<(DomainRenewInfo & { registrarKey: string })[]> {
  const domainSummariesMap = new Map<
    NamefiNormalizedDomain,
    (typeof domainSummaries)[number]
  >(domainSummaries.map((summary) => [summary.normalizedDomainName, summary]));

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
    throw ApplicationFailure.create({
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
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      autoRenewEnabled:
        sql<boolean>`coalesce(${domainUserPreferencesTable.autoRenewEnabled}, false)`.as(
          'autoRenewEnabled',
        ),
      chainId: namefiNftOwnersView.chainId,
      ownerAddress: namefiNftOwnersView.ownerAddress,
    })
    .from(namefiNftOwnersView)
    .leftJoin(
      domainUserPreferencesTable,
      and(
        eq(
          namefiNftOwnersView.normalizedDomainName,
          domainUserPreferencesTable.normalizedDomainName,
        ),
        eq(domainUserPreferencesTable.userId, userId),
      ),
    )
    .where(inArray(namefiNftOwnersView.ownerAddress, evmWallets));

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

  // Use getDomainListInfo to get pricing for all domains at once
  const domainInfoList = await getDomainListInfo(normalizeDomainNameList);

  for (const domainInfo of domainInfoList) {
    const { domain, pricingDetails } = domainInfo;

    if (!pricingDetails?.renewalPrice) {
      // No pricing info available, set to 0
      throw ApplicationFailure.create({
        message: `No pricing info available for domain ${domain}`,
        nonRetryable: true,
      });
    }

    try {
      const chargeAmount = computeChargesInUsdFromDomainAvailabilityInfo(
        { pricingDetails },
        1, // 1 year renewal
        'RENEW',
      );
      domainChargeAmounts[domain] = chargeAmount;
    } catch (error) {
      logger.warn(`Failed to compute charges for domain ${domain}: ${error}`);
      throw ApplicationFailure.create({
        message: `Failed to compute charges for domain ${domain}: ${error}`,
        nonRetryable: true,
      });
    }
  }

  return domainChargeAmounts;
}

/**
 * Get expiration dates for 3LD domains from the blockchain
 */
async function get3ldExpirationDatesForDomains(
  nfts: {
    normalizedDomainName: NamefiNormalizedDomain;
    chainId: number;
  }[],
): Promise<
  {
    normalizedDomainName: NamefiNormalizedDomain;
    expirationTime: Date | null;
  }[]
> {
  if (nfts.length === 0) {
    return [];
  }

  // Import viem client here to avoid circular dependencies
  const groupByChainId = groupBy(pipe(prop('chainId'), toStringR), nfts);

  const expirationResultsByChainId = (await Promise.all(
    toPairs(groupByChainId).map(async ([chainId, domains]) => {
      if (!domains) {
        return [];
      }

      const viemBasePublicClient = getViemPublicClient(Number(chainId));
      const tokenIds =
        domains?.map((domain) =>
          nftIdFromDomainName(domain.normalizedDomainName),
        ) ?? [];
      const latestBlock = await viemBasePublicClient.getBlockNumber();
      const expirationResults = await viemBasePublicClient.multicall({
        contracts: tokenIds.map((tokenId) => ({
          address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
          abi: NftAbi,
          functionName: 'getExpiration' as const,
          args: [tokenId],
          blockNumber: latestBlock,
        })),
      });

      return [
        chainId,
        fromPairs(
          expirationResults.map((result, i: number) => [
            domains[i].normalizedDomainName as NamefiNormalizedDomain,
            result.status === 'success'
              ? fromUnixTime(Number(result.result))
              : null,
          ]),
        ),
      ];
    }),
  )) as [string, Record<NamefiNormalizedDomain, Date | null>][];

  const expirationResultsByChainIdMap = fromPairs(expirationResultsByChainId);

  return nfts.map((nft) => ({
    normalizedDomainName: nft.normalizedDomainName,
    expirationTime:
      expirationResultsByChainIdMap[nft.chainId]?.[nft.normalizedDomainName] ??
      null,
  }));
}
