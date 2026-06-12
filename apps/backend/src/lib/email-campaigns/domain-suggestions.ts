import type { NamefiNormalizedDomain } from '@namefi-astra/utils';
import {
  db,
  namefiNftOwnersCte,
  namefiNftOwnersView,
  usersTable,
} from '@namefi-astra/db';
import { eq, inArray } from 'drizzle-orm';
import { createLogger } from '#lib/logger';
import { generateDreamDomainSuggestions } from '@namefi-astra/ai';
import {
  getPrivyUserLinkedEthereumChecksumWalletAddresses,
  privyClient,
} from '../../trpc/utils';
import { resolve } from '../../utils/resolve';

const logger = createLogger({ module: 'domain-suggestions' });

type UserDomainSuggestionOptions = {
  ownedDomainFilter?: NamefiNormalizedDomain[];
};

export async function getUserDomainSuggestions(
  userId: string,
  options?: UserDomainSuggestionOptions,
): Promise<NamefiNormalizedDomain[]> {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
      columns: { privyUserId: true },
    });

    if (!user?.privyUserId) {
      logger.debug({ userId }, 'No privy user for domain suggestions');
      return [];
    }

    const [privyError, privyUser] = await resolve(
      privyClient.getUserById(user.privyUserId),
    );

    if (privyError || !privyUser) {
      logger.warn(
        { userId, error: privyError },
        'Failed to load privy user for domain suggestions',
      );
      return [];
    }

    let walletAddresses: string[] = [];
    try {
      walletAddresses = getPrivyUserLinkedEthereumChecksumWalletAddresses({
        privyUser,
      });
    } catch (error) {
      logger.warn(
        { userId, error },
        'Failed to derive wallet addresses for domain suggestions',
      );
      return [];
    }

    if (walletAddresses.length === 0) {
      logger.debug({ userId }, 'No wallet addresses for suggestions');
      return [];
    }

    const ownedDomains = await db
      .with(namefiNftOwnersCte)
      .select({
        normalizedDomainName: namefiNftOwnersView.normalizedDomainName,
      })
      .from(namefiNftOwnersView)
      .where(inArray(namefiNftOwnersView.ownerAddress, walletAddresses));

    const ownedDomainNames = Array.from(
      new Set(ownedDomains.map((row) => row.normalizedDomainName)),
    );

    if (ownedDomainNames.length === 0) {
      logger.debug({ userId }, 'User owns no domains for suggestions');
      return [];
    }

    const ownedDomainSet = new Set(ownedDomainNames);

    const filteredOwnedDomainNames = options?.ownedDomainFilter?.length
      ? Array.from(
          new Set(
            options.ownedDomainFilter.filter((domain) =>
              ownedDomainSet.has(domain),
            ),
          ),
        )
      : ownedDomainNames;

    if (filteredOwnedDomainNames.length === 0) {
      logger.debug(
        { userId },
        'No matching owned domains after applying suggestion filter',
      );
      return [];
    }

    const { suggestions } = await generateDreamDomainSuggestions({
      ownedDomains: filteredOwnedDomainNames,
      onLog: (level, message, meta) => {
        const payload = { userId, ...meta };
        switch (level) {
          case 'debug':
            logger.debug(payload, message);
            break;
          case 'info':
            logger.info(payload, message);
            break;
          case 'warn':
            logger.warn(payload, message);
            break;
          case 'error':
            logger.error(payload, message);
            break;
          default:
            logger.info(payload, message);
        }
      },
    });

    return suggestions;
  } catch (error) {
    logger.debug({ userId, error }, 'Failed to fetch domain suggestions');
    return [];
  }
}
