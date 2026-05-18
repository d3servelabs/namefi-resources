import KeyvPostgres from '@keyv/postgres';
import Keyv from 'keyv';
import pMap from 'p-map';
import { secrets } from '#lib/env';
import { logger } from '#lib/logger';
import type {
  DomainIndexFunctions,
  IndexedDomainSummary,
  ListDomainsOptions,
} from '@namefi-astra/registrars/centralnic/domain-index';
import type { CentralNicRegistrarService } from '@namefi-astra/registrars/sub-registrars';
import type { PunycodeDomainName } from '@namefi-astra/registrars/data/validations';

const ote2KeyvPostgres = new KeyvPostgres({
  uri: secrets.DATABASE_URL,
  schema: '__keyv_centralnic_ote2',
  table: 'domain_index',
});

const ote2Keyv = new Keyv(ote2KeyvPostgres, {
  namespace: 'centralnic-ote2',
});

ote2Keyv.on('error', (error) => {
  logger.error({ error }, 'CentralNic OTE2 domain index keyv error');
});

/**
 * Legacy aggregate-list key written by earlier revisions of this module.
 * Each domain is now its own keyv row — the single, atomically-updated
 * source of truth — so this key is no longer written. `listDomainsInIndex`
 * skips it defensively in case a stale one lingers from a prior revision.
 */
const LEGACY_INDEX_KEY = '__index';

function reviveDates(domain: IndexedDomainSummary): IndexedDomainSummary {
  return {
    ...domain,
    expirationDate: domain.expirationDate
      ? new Date(domain.expirationDate)
      : undefined,
    lastSyncedAt: domain.lastSyncedAt
      ? new Date(domain.lastSyncedAt)
      : undefined,
  };
}

export const centralnicOte2DomainIndex = {
  async addDomainsToIndex(domains) {
    let added = 0;
    for (const domain of domains) {
      // Each domain is its own keyv row; a single `set` is an atomic
      // single-row upsert, so no cross-key coordination is needed.
      const isNew = !(await ote2Keyv.has(domain.domainName));
      await ote2Keyv.set(domain.domainName, {
        ...domain,
        lastSyncedAt: domain.lastSyncedAt ?? new Date(),
      });
      if (isNew) {
        added += 1;
      }
    }
    return added;
  },

  async removeDomainsFromIndex(domainNames) {
    let removed = 0;
    for (const name of domainNames) {
      if (await ote2Keyv.delete(name)) {
        removed += 1;
      }
    }
    return removed;
  },

  async listDomainsInIndex(options?: ListDomainsOptions) {
    const iterate = ote2Keyv.iterator;
    if (!iterate) {
      throw new Error('CentralNic OTE2 keyv store does not support iteration');
    }
    let domains: IndexedDomainSummary[] = [];
    for await (const [key, value] of iterate(ote2Keyv.namespace)) {
      if (key === LEGACY_INDEX_KEY || !value) {
        continue;
      }
      domains.push(reviveDates(value as IndexedDomainSummary));
    }

    if (options?.accountKey) {
      domains = domains.filter((d) => d.accountKey === options.accountKey);
    }
    if (options?.customerId) {
      domains = domains.filter((d) => d.customerId === options.customerId);
    }
    if (options?.tld) {
      domains = domains.filter((d) => d.domainName.endsWith(`.${options.tld}`));
    }
    if (!options?.includeExpired) {
      const now = new Date();
      domains = domains.filter(
        (d) => !d.expirationDate || d.expirationDate > now,
      );
    }

    const total = domains.length;
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? total;
    return { domains: domains.slice(offset, offset + limit), total };
  },

  async updateDomainsInIndex(updates) {
    let updated = 0;
    for (const update of updates) {
      const existing = await ote2Keyv.get<IndexedDomainSummary>(
        update.domainName,
      );
      if (!existing) continue;
      await ote2Keyv.set(update.domainName, {
        ...existing,
        ...update,
        lastSyncedAt: update.lastSyncedAt ?? new Date(),
      });
      updated += 1;
    }
    return updated;
  },

  async getDomainFromIndex(domainName) {
    const entry = await ote2Keyv.get<IndexedDomainSummary>(domainName);
    return entry ? reviveDates(entry) : undefined;
  },

  async domainExistsInIndex(domainName) {
    return ote2Keyv.has(domainName);
  },
} satisfies DomainIndexFunctions;

export interface RefreshIndexResult {
  checked: number;
  removed: number;
  removedDomains: PunycodeDomainName[];
  aborted: boolean;
}

const REFRESH_ABORT_RATIO = 0.5;
const REFRESH_CONCURRENCY = 25;

/**
 * EPP code 2303 ("Object does not exist") is the definitive "domain is not in
 * this account" signal. `handleEppResult` surfaces it as an `EPP 2303: ...`
 * message string, so we match on that the same way `routers/rdap.ts` does.
 * Any other error (transport failure, timeout, rate limit) is transient and
 * must not cause a removal.
 */
function isDomainNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('EPP 2303') ||
    message.toLowerCase().includes('does not exist')
  );
}

export async function refreshIndex(
  registrar: CentralNicRegistrarService,
): Promise<RefreshIndexResult> {
  const { domains } = await centralnicOte2DomainIndex.listDomainsInIndex({
    includeExpired: true,
  });

  if (domains.length === 0) {
    return { checked: 0, removed: 0, removedDomains: [], aborted: false };
  }

  const removable: PunycodeDomainName[] = [];
  let skipped = 0;

  await pMap(
    domains,
    async (entry) => {
      try {
        await registrar.getDomainDetails(entry.domainName);
      } catch (error) {
        if (isDomainNotFoundError(error)) {
          logger.debug(
            { error, domain: entry.domainName },
            'Domain no longer in CentralNic OTE2 account; marking for index removal',
          );
          removable.push(entry.domainName);
        } else {
          skipped += 1;
          logger.warn(
            { error, domain: entry.domainName },
            'Transient error checking CentralNic OTE2 domain; keeping in index',
          );
        }
      }
    },
    { concurrency: REFRESH_CONCURRENCY },
  );

  if (skipped > 0) {
    logger.info(
      { skipped, total: domains.length },
      'Skipped %d CentralNic OTE2 domain(s) due to transient errors',
      skipped,
    );
  }

  if (removable.length > domains.length * REFRESH_ABORT_RATIO) {
    logger.warn(
      { removable: removable.length, total: domains.length },
      'Refusing to remove >%d%% of CentralNic OTE2 index entries; aborting refresh',
      REFRESH_ABORT_RATIO * 100,
    );
    return {
      checked: domains.length,
      removed: 0,
      removedDomains: [],
      aborted: true,
    };
  }

  if (removable.length > 0) {
    await centralnicOte2DomainIndex.removeDomainsFromIndex(removable);
  }

  return {
    checked: domains.length,
    removed: removable.length,
    removedDomains: removable,
    aborted: false,
  };
}
