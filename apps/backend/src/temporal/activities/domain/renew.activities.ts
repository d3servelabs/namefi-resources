import { getViemPublicClient } from '#lib/crypto/viem-clients';
import {
  checksumWalletAddressSchema,
  type ChecksumWalletAddress,
  type NamefiNormalizedDomain,
  resolve,
} from '@namefi-astra/utils';
import { RenewOption } from '@namefi-astra/registrars/lib/abstract-registrar/index';
import { differenceInDays, isBefore, subHours } from 'date-fns';
import {
  isNotNil,
  and,
  groupBy,
  prop,
  indexBy,
  pluck,
  toPairs,
  pipe,
  toString as toStringR,
  fromPairs,
  isNil,
  isNotEmpty,
} from 'ramda';
import { sendMail } from '../../../mail/mail-client';
import {
  db,
  namefiNftOwnersView,
  domainUserPreferencesTable,
  type PaymentProvider,
  namefiNftOwnersCte,
  namefiNftCte,
} from '@namefi-astra/db';
import { sldRegistrar } from '#lib/namefi-registry';
import React from 'react';
import { render } from '@react-email/components';
import {
  DomainUpcomingRenewal,
  type DomainUpcomingRenewalProps,
} from '../../../mail/templates/domain-upcoming-renewal';
import { DomainRenewReport } from '../../../mail/templates/domain-renew-report';
import {
  DomainRenewFailedToCharge,
  type DomainRenewFailedToChargeProps,
} from '../../../mail/templates/domain-renew-failed-to-charge';
import { calculateNextChargeDateAndAmount } from './helpers/calculateNextChargeDateAndAmount';
import { privyClient } from '../../../trpc/utils';
import type { WalletWithMetadata } from '@privy-io/server-auth';
import { eq, inArray, sql } from 'drizzle-orm';
import {
  RENEW_EARLY_BY_DAYS,
  SEND_RENEW_REMINDERS_THRESHOLD,
} from '../../../lib/env/consts';
import { ApplicationFailure } from '@temporalio/workflow';
import { logger } from '#lib/logger';
import { getDomainLevels } from '#lib/get-domain-levels';
import { getAllowedChainsForNft } from '#lib/env/allowed-chains';
import { nftIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { NftAbi } from '@namefi-astra/utils/abis/namefi-nft';
import { fromUnixTime } from 'date-fns';
import { NAMEFI_NFT_CONTRACT_ADDRESS } from '@namefi-astra/utils';
import { getDomainListInfo } from '#lib/namefi-registry';
import { computeChargesInUsdFromDomainAvailabilityInfo } from '@namefi-astra/registrars/multi-year-pricing';
import { secrets } from '#lib/env';
import { TEMPORAL_QUEUES } from '../../../temporal/shared/enums';
import { temporalClient } from '../../../temporal/client';
import { toPunycodeDomainName } from '@namefi-astra/registrars/lib/data/validations';
import pMap from 'p-map';
import { namefiNftView } from '@namefi-astra/db';
import { RDAP } from '@namefi-astra/registrars/lib/rdap-whois/rdap_client';
import type { PrepareMultiPaymentsOutput } from '#temporal/workflows/prepare-multi-payments.workflow';

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

export async function getDomainsUpForRenewal(input?: {
  allowExpired?: boolean;
}): Promise<
  {
    normalizedDomainName: NamefiNormalizedDomain;
    expirationTime: Date;
    registrarKey: string;
  }[]
> {
  const allowExpired = input?.allowExpired ?? false;
  logger.assign({ component: 'getDomainsUpForRenewal' });
  logger.debug('Starting getDomainsUpForRenewal');

  // Get 3LD domains from NFT table
  logger.debug('Fetching NFTs from database');
  const allNfts = await db
    .with(namefiNftOwnersCte)
    .select({
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      chainId: namefiNftOwnersView.chainId,
    })
    .from(namefiNftOwnersView)
    .where(inArray(namefiNftOwnersView.chainId, getAllowedChainsForNft()));
  logger.debug({ nftCount: allNfts.length }, 'Found NFTs');

  const allNftsMap = new Map<NamefiNormalizedDomain, number>(
    allNfts.map((nft) => [nft.normalizedDomainName, nft.chainId]),
  );

  // Get 2LD domains from registrar
  logger.debug('Fetching 2LD domains from registrar');
  const sldDomains = await sldRegistrar.listAllDomains();
  logger.debug({ sldCount: sldDomains.length }, 'Found SLD domains');

  const sldDomainsWithUpcomingRenewal = sldDomains.filter((domain) => {
    const daysToExpiration = differenceInDays(
      domain.expirationTime,
      new Date(),
    );
    return (
      allNftsMap.has(domain.domainName) && // Only include domains that are on an allowed chain and has NFT
      daysToExpiration <= SEND_RENEW_REMINDERS_THRESHOLD &&
      (allowExpired || daysToExpiration >= 0)
    );
  });
  logger.debug(
    { count: sldDomainsWithUpcomingRenewal.length },
    'Found SLD domains with upcoming renewal',
  );

  // Filter for 3LD domains only
  const _3ldNfts = allNfts.filter((nft) => {
    const domainLevels = getDomainLevels(nft.normalizedDomainName);
    return domainLevels.levels.length === 3;
  });
  logger.debug({ count: _3ldNfts.length }, 'Found 3LD NFTs');

  // Get expiration dates for 3LD domains
  logger.debug('Fetching expiration dates for 3LD domains');
  const _3ldDomainsWithExpiration =
    await get3ldExpirationDatesForDomains(_3ldNfts);
  logger.debug(
    { count: _3ldDomainsWithExpiration.length },
    'Found 3LD domains with expiration dates',
  );

  // Filter 3LD domains with upcoming renewal and valid expiration times
  const _3ldDomainsWithUpcomingRenewal = _3ldDomainsWithExpiration
    .filter((domain) => {
      if (!domain.expirationTime) return false;
      const daysToExpiration = differenceInDays(
        domain.expirationTime,
        new Date(),
      );
      if (
        process.env.FORCE_AUTO_RENEW_WITH_CLUB === 'true' &&
        (domain.normalizedDomainName.endsWith('.withharris.club') ||
          domain.normalizedDomainName.endsWith('.withtrump.club'))
      ) {
        return true;
      }
      return (
        daysToExpiration <= SEND_RENEW_REMINDERS_THRESHOLD &&
        (allowExpired || daysToExpiration >= 0)
      );
    })
    .map((domain) => ({
      normalizedDomainName: domain.normalizedDomainName,
      expirationTime: domain.expirationTime as Date, // We've already filtered out null values
      registrarKey: 'namefi-nft' as const,
    }));
  logger.debug(
    { count: _3ldDomainsWithUpcomingRenewal.length },
    'Found 3LD domains with upcoming renewal',
  );

  // Combine 2LD and 3LD domains
  const allDomainsWithUpcomingRenewal = [
    ...sldDomainsWithUpcomingRenewal.map((domain) => ({
      normalizedDomainName: domain.domainName,
      expirationTime: domain.expirationTime,
      registrarKey: domain.registrarKey,
    })),
    ..._3ldDomainsWithUpcomingRenewal,
  ];

  logger.debug(
    { count: allDomainsWithUpcomingRenewal.length },
    'Completed getDomainsUpForRenewal',
  );
  return allDomainsWithUpcomingRenewal;
}

export async function getUserWithEvmWallets() {
  logger.assign({ component: 'getUserWithEvmWallets' });
  logger.debug('Starting getUserWithEvmWallets');

  logger.debug('Fetching users from database');
  const users = await db.query.usersTable.findMany({
    columns: {
      id: true,
      privyUserId: true,
    },
  });
  logger.debug({ usersCount: users.length }, 'Fetched users from database');

  logger.debug('Fetching users from Privy');
  const privyUsers = await privyClient.getUsers();
  logger.debug(
    { privyUsersCount: privyUsers.length },
    'Fetched users from Privy',
  );

  logger.debug(
    { privyUsersCount: privyUsers.length, namefiUsersCount: users.length },
    'Fetched users from Privy and database',
  );

  const usersPrivyUserIdToNamefiUserIdMap = new Map<string, string>(
    users.map((user) => [user.privyUserId, user.id]),
  );

  logger.debug(
    { mappedUsersCount: usersPrivyUserIdToNamefiUserIdMap.size },
    'Created user ID mapping',
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

      logger.debug(
        { privyUserId: privyUser.id, walletsCount: wallets.length },
        'Processing user wallets',
      );

      const userId = usersPrivyUserIdToNamefiUserIdMap.get(privyUser.id);
      if (!userId) {
        logger.error(
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

  logger.debug(
    { usersWithWalletsCount: usersWithEvmWallets.length },
    'Filtered users with EVM wallets',
  );

  const walletToUserIdMap = new Map<
    string,
    (typeof usersWithEvmWallets)[number]
  >();
  for (const user of usersWithEvmWallets) {
    for (const wallet of user.wallets) {
      walletToUserIdMap.set(wallet, user);
    }
  }

  logger.debug(
    { totalWalletMappings: walletToUserIdMap.size },
    'Created wallet to user mapping',
  );

  logger.debug('Completed getUserWithEvmWallets');
  return {
    walletToUserIdMap,
    usersWithEvmWallets,
  };
}

export async function getDomainsUpForRenewalGroupedByOwner(input?: {
  parentDomains?: NamefiNormalizedDomain[];
  allowExpired?: boolean;
}) {
  const parentDomains = input?.parentDomains ?? [];
  const allowExpired = input?.allowExpired ?? false;
  logger.debug('Getting domains up for renewal grouped by owner');
  // Get both wallet-to-user mapping and domains that need renewal
  logger.debug('Fetching domains up for renewal');
  const domainsUpForRenewal = await getDomainsUpForRenewal({ allowExpired });
  const filteredDomainsUpForRenewal = parentDomains.length
    ? domainsUpForRenewal.filter((domain) =>
        parentDomains.some(
          (parentDomain) =>
            domain.normalizedDomainName === parentDomain ||
            domain.normalizedDomainName.endsWith(`.${parentDomain}`),
        ),
      )
    : domainsUpForRenewal;
  logger.debug(
    {
      domainsUpForRenewalCount: domainsUpForRenewal.length,
      filteredDomainsUpForRenewalCount: filteredDomainsUpForRenewal.length,
      parentDomains,
      allowExpired,
    },
    'Fetched domains up for renewal',
  );

  logger.debug('Fetching wallet to user mapping');
  const { walletToUserIdMap } = await getUserWithEvmWallets();
  logger.debug(
    { walletToUserIdMapCount: walletToUserIdMap.size },
    'Fetched wallet to user mapping',
  );

  logger.debug(
    `Found ${filteredDomainsUpForRenewal.length} domains up for renewal`,
  );
  if (filteredDomainsUpForRenewal.length === 0) {
    return {};
  }
  // Fetch NFT domain details for all domains up for renewal
  logger.debug('Fetching NFT domain details for all domains up for renewal');
  const nftDomains = await db
    .with(namefiNftOwnersCte)
    .select({
      normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      ownerAddress: namefiNftOwnersView.ownerAddress,
      chainId: namefiNftOwnersView.chainId,
    })
    .from(namefiNftOwnersView)
    .where(
      inArray(
        namefiNftOwnersView.normalizedDomainName,
        filteredDomainsUpForRenewal.map(
          (domain) => domain.normalizedDomainName,
        ),
      ),
    );

  logger.debug(`Found ${nftDomains.length} NFT domains up for renewal`);

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
    pluck('normalizedDomainName', filteredDomainsUpForRenewal),
  );

  // Process each domain to add owner details and auto-renewal preferences
  const domainsUpForRenewalWithOwnerDetails = filteredDomainsUpForRenewal.map(
    (domain) => {
      // Get NFT details for this domain
      const domainNft = domainNftMap.get(domain.normalizedDomainName);
      if (!domainNft) {
        logger.error(
          { domainName: domain.normalizedDomainName },
          'Domain not found in nftDomains',
        );
        return null;
      }

      // Get user details for the domain owner
      const user = walletToUserIdMap.get(domainNft.ownerAddress);
      if (!user) {
        logger.error(
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
      if (
        process.env.FORCE_AUTO_RENEW_WITH_CLUB === 'true' &&
        isNil(domainUserPreferences) &&
        (domain.normalizedDomainName.endsWith('.withharris.club') ||
          domain.normalizedDomainName.endsWith('.withtrump.club'))
      ) {
        autoRenewOption = RenewOption.AUTOMATIC;
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
  const domainsUpForRenewalWithOwnerDetailsGroupedByUser = groupBy(
    prop('userId'),
    domainsUpForRenewalWithOwnerDetails.filter(isNotNil),
  );
  logger.debug(
    `Found ${Object.keys(domainsUpForRenewalWithOwnerDetailsGroupedByUser).length} owners with domains up for renewal`,
  );
  return domainsUpForRenewalWithOwnerDetailsGroupedByUser;
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
    logger.error(
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
    .with(namefiNftOwnersCte)
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
  {
    domains,
    userId,
    expectedPayments,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
    paymentPreparationSummary,
  }: DomainsUpForRenewalWithUserWithPrice & {
    expectedPayments: Array<{
      provider: PaymentProvider;
      amountInUsdCents: number;
      paymentId: string;
      walletAddress?: string;
      stripeLast4?: string;
    }>;
    availableBalanceInNfsc: number;
    availableOffChainPaymentMethodsPublicIdentifiers: string[];
    paymentPreparationSummary: PrepareMultiPaymentsOutput['preparationSummary'];
  },
) {
  if (!userEmail) {
    logger.warn(
      { domains, userId },
      `Attempted to send email notification for upcoming renew but no email found for user ${userId}`,
    );
    return;
  }
  logger.debug(
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
    expectedPayments,
    availableBalanceInNfsc,
    availableOffChainPaymentMethodsPublicIdentifiers,
    paymentPreparationSummary,
  } satisfies DomainUpcomingRenewalProps);

  const html = await render(populatedTemplate, {
    pretty: true,
    plainText: false,
  });
  const plain = await render(populatedTemplate, {
    pretty: false,
    plainText: true,
  });

  await sendMail({
    to: [userEmail],
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject: 'Domain Renew Notice | Namefi',
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
  paymentMethods,
  refundAmountInUsd,
  refundStatus,
  chargedAmountInUsd,
  userEmail,
  orderId,
  chargeAmountInUsdByDomainLdh,
  expirationDatesByDomainLdh,
  availableBalanceInNfsc,
  availableOffChainPaymentMethods,
}: {
  userId: string;
  domainLdhRenewFailed: string[];
  domainLdhRenewSucceeded: string[];
  paymentMethods: Array<{
    provider: PaymentProvider;
    amountInUsdCents: number;
    paymentId: string;
    walletAddress?: string;
    stripeLast4?: string;
  }>;
  refundAmountInUsd: number | null | undefined;
  refundStatus: 'SUCCESS' | 'FAILED';
  userEmail: string;
  orderId?: string | null;
  chargedAmountInUsd: number;
  chargeAmountInUsdByDomainLdh: Record<string, number>;
  expirationDatesByDomainLdh: Record<string, Date>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
}) {
  const originalOrderDetails = {
    recipientName: userEmail,
    recipientUserId: userId,
    recipientEmail: userEmail,
    chargedAmountInUsd,
    chargeAmountInUsdByDomainLdh,
    expirationDatesByDomainLdh,
    availableBalanceInNfsc,
    availableOffChainPaymentMethods,
    domainLdhRenewFailed,
    domainLdhRenewSucceeded,
    payments: paymentMethods,
    refundAmountInUsd,
    refundStatus,
    orderId,
  };
  // [clickup:NFI-5273] We don't want user to see failed, instead send them to Namefi Dev Team
  const noFailedRenewals = domainLdhRenewFailed.length === 0;
  const noSuccessfullRenewals = domainLdhRenewSucceeded.length === 0;

  if (noSuccessfullRenewals) {
    // Namefi Dev Team is already alerted as a part of renew report as well
    void sendAlertToSlack({
      title: 'All Renewals failed for user',
      message: `(${userEmail})(${userId})`,
      extraData: {},
    });
    return;
  }

  const adjustedOrderDetails = noFailedRenewals
    ? originalOrderDetails
    : {
        ...originalOrderDetails,
        domainLdhRenewFailed: [],
        //payments are removed, otherwise it'll confuse the user because some items are removed from the list
        payments: [],
      };

  const populatedTemplate = React.createElement(
    DomainRenewReport,
    adjustedOrderDetails,
  );

  const html = await render(populatedTemplate, {
    pretty: true,
    plainText: false,
  });
  const plain = await render(populatedTemplate, {
    pretty: false,
    plainText: true,
  });
  const subject = 'Domain Renewal Report - Success | Namefi';
  // This is commented out for the time being because we stopped send failed details to user
  // if (domainLdhRenewFailed.length > 0) {
  //   subject =
  //     '[Action May Be Required] Domain Renewal Report - Failed | Namefi';
  // }

  await sendMail({
    to: [userEmail],
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject,
    content: {
      html,
      plain,
    },
  });
}

export async function sendEmailNotificationForRenewFailedToCharge({
  domainsToRenew,
  userId,
  userEmail,
  chargeAmountInUsdByDomainLdh,
  expirationDatesByDomainLdh,
  availableBalanceInNfsc,
  availableOffChainPaymentMethods,
}: {
  domainsToRenew: string[];
  userId: string;
  userEmail: string;
  chargeAmountInUsdByDomainLdh: Record<string, number>;
  expirationDatesByDomainLdh: Record<string, Date>;
  availableBalanceInNfsc: number;
  availableOffChainPaymentMethods: string[];
}) {
  const populatedTemplate = React.createElement(DomainRenewFailedToCharge, {
    recipientName: userEmail,
    recipientEmail: userEmail,
    domainsToRenew,
    chargeAmountInUsdByDomainLdh,
    expirationDatesByDomainLdh,
    availableBalanceInNfsc,
    availableOffChainPaymentMethods,
  } satisfies DomainRenewFailedToChargeProps);

  const html = await render(populatedTemplate, {
    pretty: true,
    plainText: false,
  });
  const plain = await render(populatedTemplate, {
    pretty: false,
    plainText: true,
  });

  await sendMail({
    to: [userEmail],
    bcc: ['customer-email-archive@d3serve.xyz'],
    subject: '[Action Required] Domain Renewal - Payment Failed | Namefi',
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
export async function getRenewPriceByDomainInUsd({
  normalizeDomainNameList,
  retriesForFailedDomains = 2,
}: {
  normalizeDomainNameList: NamefiNormalizedDomain[];
  retriesForFailedDomains?: number;
}): Promise<Record<NamefiNormalizedDomain, number | null>> {
  logger.assign({ context: 'getRenewPriceByDomainInUsd' });
  const domainChargeAmounts: Record<NamefiNormalizedDomain, number | null> = {};

  // Use getDomainListInfo to get pricing for all domains at once
  const domainInfoList = await getDomainListInfo(normalizeDomainNameList);

  for (const domainInfo of domainInfoList) {
    const { domain, pricingDetails } = domainInfo;

    if (!pricingDetails?.renewalPrice) {
      logger.warn(
        { domain, pricingDetails },
        `No renewal price found for domain ${domain}`,
      );
      domainChargeAmounts[domain] = null;
      continue;
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

  // Retry failed domains
  if (retriesForFailedDomains > 0) {
    const failedDomains = (
      Object.keys(domainChargeAmounts) as NamefiNormalizedDomain[]
    ).filter((domain) => domainChargeAmounts[domain] === null);

    if (failedDomains.length > 0) {
      const retryDomainChargeAmounts = await getRenewPriceByDomainInUsd({
        normalizeDomainNameList: failedDomains,
        retriesForFailedDomains: retriesForFailedDomains - 1,
      });
      Object.assign(domainChargeAmounts, retryDomainChargeAmounts);
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

/**
 * Queries the active renewal workflow for a domain
 * @param domainName - The domain name to query the active renewal workflow for
 * @returns {Promise<{workflowId: string, runId: string, workflowType: string, status: string} | null>} - The active renewal workflow for the domain
 */
export async function maybeQueryActiveRenewalWorkflow(
  domainName: NamefiNormalizedDomain,
) {
  try {
    const workflows = await temporalClient.workflow.list({
      query: `TaskQueue = '${TEMPORAL_QUEUES.DOMAINS}' AND ExecutionStatus = 'Running' AND (WorkflowId = 'extend-domain-${domainName}')`,
    });

    for await (const workflow of workflows) {
      const status = await workflow.status;
      if (status.name === 'RUNNING') {
        return {
          workflowId: workflow.workflowId,
          runId: workflow.runId,
          workflowType: workflow.type,
          status: status.name,
        };
      }
    }
  } catch (error) {
    logger.error(
      { domainName, error },
      'Failed to query active renewal workflow',
    );
  }
  return null;
}

// #region Get Expiration Dates

export async function getDomainsExpirationDatesFromIndex(
  normalizedDomainNames: NamefiNormalizedDomain[],
): Promise<Record<string, Date | null>> {
  const groupedDomainNames = groupBy((normalizedDomainName) => {
    const domainLevels = getDomainLevels(normalizedDomainName);
    if (domainLevels.levels.length === 2) {
      return 'sld';
    }
    if (domainLevels.levels.length === 3) {
      return '3ld';
    }
    return 'unknown'; // this should never happen but to satisfy typescript
  }, normalizedDomainNames);

  const sldDomainNames = groupedDomainNames.sld ?? [];
  const _3ldDomainNames = groupedDomainNames['3ld'] ?? [];

  const unknownDomainNames = groupedDomainNames.unknown ?? [];
  if (isNotEmpty(unknownDomainNames)) {
    logger.error(
      { context: 'getDomainsExpirationDates', unknownDomainNames },
      'Unknown domain levels',
    );
  }

  const [sldExpirationDates, nftsExpirationDates] = await Promise.all([
    getSldExpirationDateForDomainList(sldDomainNames),
    getExpirationDateForDomainListFromNftIndex([
      ..._3ldDomainNames,
      ...sldDomainNames,
    ]),
  ]);

  const nftsExpirationDatesMap = Object.fromEntries(
    nftsExpirationDates?.map((data) => [
      data.normalizedDomainName,
      data.expirationDate,
    ]) ?? [],
  );

  return Object.fromEntries([
    ...sldDomainNames.map((domainName, i) => [
      domainName,
      sldExpirationDates[i] ?? nftsExpirationDatesMap[domainName],
    ]),
    ..._3ldDomainNames.map((domainName, i) => [
      domainName,
      nftsExpirationDatesMap[domainName],
    ]),
    ...unknownDomainNames.map((domainName) => [domainName, null]),
  ]);
}

export async function getExpirationDateForDomainListFromNftIndex(
  normalizedDomainNames: NamefiNormalizedDomain[],
) {
  const nfts = await db
    .with(namefiNftCte)
    .select({
      tokenId: namefiNftView.tokenId,
      normalizedDomainName: namefiNftView.normalizedDomainName,
      expirationTime: namefiNftView.expirationTime,
      chainId: namefiNftView.chainId,
    })
    .from(namefiNftView)
    .where(inArray(namefiNftView.normalizedDomainName, normalizedDomainNames));
  const nftsByDomainName = indexBy(prop('normalizedDomainName'), nfts);

  return normalizedDomainNames.map((domainName) => {
    const nft = nftsByDomainName[domainName];
    return {
      normalizedDomainName: domainName,
      expirationDate: nft?.expirationTime,
      tokenId: nft?.tokenId?.toString(),
      chainId: nft?.chainId,
    };
  });
}

export async function get3ldExpirationDateForDomainListFromIndex(
  normalizedDomainNames: NamefiNormalizedDomain[],
) {
  return getExpirationDateForDomainListFromNftIndex(normalizedDomainNames);
}

export async function get3ldExpirationDateForDomainListFromContract(
  normalizedDomainNames: NamefiNormalizedDomain[],
  latestBlock: bigint,
  chainId: number,
) {
  const tokenIds = normalizedDomainNames.map(nftIdFromDomainName);
  const expirationDates = await getViemPublicClient(chainId).multicall({
    contracts: tokenIds.map((tokenId) => ({
      address: NAMEFI_NFT_CONTRACT_ADDRESS as `0x${string}`,
      abi: NftAbi,
      functionName: 'getExpiration' as const,
      args: [BigInt(tokenId)],
      blockNumber: latestBlock,
    })),
  });

  return expirationDates.map((result, i) => {
    if (result.status === 'failure') {
      return {
        normalizedDomainName: normalizedDomainNames[i],
        expirationDate: null,
        tokenId: tokenIds[i].toString(),
      };
    }

    return {
      normalizedDomainName: normalizedDomainNames[i],
      expirationDate: fromUnixTime(Number(result.result)),
      tokenId: tokenIds[i].toString(),
    };
  });
}

export async function getSldExpirationDateForDomainList(
  normalizedDomainNames: NamefiNormalizedDomain[],
  options?: {
    fallbackOption: 'NONE' | 'RDAP';
  },
) {
  const indexedExpirationDates = await db.query.indexedDomainsTable.findMany({
    where: (table, { inArray }) =>
      inArray(table.normalizedDomainName, normalizedDomainNames),
    columns: {
      normalizedDomainName: true,
      expirationTime: true,
      lastIndexedAt: true,
    },
  });

  const indexedExpirationDatesMap = new Map<
    NamefiNormalizedDomain,
    Date | null
  >(
    indexedExpirationDates
      .filter(
        (domain) => !isBefore(domain.lastIndexedAt, subHours(new Date(), 3)),
      )
      .map((domain) => [
        domain.normalizedDomainName,
        domain.expirationTime ? new Date(domain.expirationTime) : null,
      ]),
  );

  const expirationDates = await pMap(
    normalizedDomainNames,
    async (normalizedDomainName) => {
      const indexedExpirationDate =
        indexedExpirationDatesMap.get(normalizedDomainName);
      if (indexedExpirationDate) {
        return indexedExpirationDate;
      }
      if (options?.fallbackOption !== 'RDAP') {
        return null;
      }
      try {
        const liveExpirationDate =
          await getLiveSldExpirationDate(normalizedDomainName);
        if (isNil(liveExpirationDate)) {
          return null;
        }
        return liveExpirationDate;
      } catch (error) {
        logger.error(
          { context: 'getSldExpirationDateForDomainList', error },
          'Failed to get live expiration date',
        );
        return null;
      }
    },
  );
  return expirationDates;
}

export async function getLiveSldExpirationDate(normalizedDomainName: string) {
  let expirationDate: Date | null = null;

  const rdapResponse = await resolve(RDAP.queryDomain(normalizedDomainName));
  if (!rdapResponse.failed) {
    expirationDate = RDAP.getExpiryDateFromRdapResponse(rdapResponse.result);
  }

  if (isNil(expirationDate)) {
    const domainDetails = await sldRegistrar.getDomainDetails(
      toPunycodeDomainName(normalizedDomainName),
    );
    expirationDate = domainDetails.expirationTime;
  }
  return expirationDate;
}

// #endregion

export async function sendAlertToSlack(args: {
  title: string;
  extraData: any;
  message: string;
}): Promise<void> {
  const { title, extraData, message, ...rest } = args;

  const webhookUrl = secrets.NAMEFI_ALERT_SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('No Slack webhook URL configured, skipping Slack Alert');
    return;
  }

  try {
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `[Alert] ${title}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Message: ${message}`,
          },
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    logger.error({ error }, 'Failed to send alert to Slack');
    throw error;
  }
}
