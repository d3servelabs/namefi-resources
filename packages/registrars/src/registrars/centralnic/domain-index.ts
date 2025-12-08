/**
 * Domain Index Interface
 *
 * Since EPP doesn't support listing domains, we use an external index
 * to track which domains exist under each account. This interface defines
 * the functions that must be provided to the CentralNic registrar for
 * domain inventory management.
 */

import type { PunycodeDomainName } from '#lib/data/validations';

/**
 * Domain summary stored in the index.
 */
export interface IndexedDomainSummary {
  /** Normalized domain name */
  domainName: PunycodeDomainName;
  /** EPP account key (for multi-account setups) */
  accountKey?: string;
  /** Registry Object ID */
  roid?: string;
  /** Domain expiration date */
  expirationDate?: Date;
  /** Current EPP statuses */
  statuses?: string[];
  /** When this record was last synced with EPP */
  lastSyncedAt?: Date;
  /** Customer ID (platform-specific) */
  customerId?: string;
}

/**
 * Options for listing domains from the index.
 */
export interface ListDomainsOptions {
  /** Filter by account key */
  accountKey?: string;
  /** Filter by customer ID */
  customerId?: string;
  /** Filter by TLD (e.g., "com", "net") */
  tld?: string;
  /** Include expired domains */
  includeExpired?: boolean;
  /** Pagination: number of results */
  limit?: number;
  /** Pagination: offset */
  offset?: number;
}

/**
 * Result of listing domains from the index.
 */
export interface ListDomainsResult {
  /** List of domains */
  domains: IndexedDomainSummary[];
  /** Total count (for pagination) */
  total: number;
}

/**
 * Domain index interface.
 *
 * Implement this interface to provide domain inventory management
 * for the CentralNic registrar. The implementation typically stores
 * domains in a database table.
 */
export interface DomainIndexFunctions {
  /**
   * Add domains to the index.
   * Called after successful domain registration.
   *
   * @param domains - Domains to add
   * @returns Number of domains added
   */
  addDomainsToIndex(domains: IndexedDomainSummary[]): Promise<number>;

  /**
   * Remove domains from the index.
   * Called after successful domain deletion or transfer out.
   *
   * @param domainNames - Domain names to remove
   * @returns Number of domains removed
   */
  removeDomainsFromIndex(domainNames: PunycodeDomainName[]): Promise<number>;

  /**
   * List domains from the index.
   * Used to get domain inventory without EPP calls.
   *
   * @param options - Filter and pagination options
   * @returns List of domains with total count
   */
  listDomainsInIndex(options?: ListDomainsOptions): Promise<ListDomainsResult>;

  /**
   * Update domains in the index.
   * Called after domain info fetch or other updates.
   *
   * @param domains - Domains to update (matched by domainName)
   * @returns Number of domains updated
   */
  updateDomainsInIndex(domains: IndexedDomainSummary[]): Promise<number>;

  /**
   * Get a single domain from the index.
   *
   * @param domainName - Domain name to look up
   * @returns Domain summary or undefined if not found
   */
  getDomainFromIndex?(
    domainName: PunycodeDomainName,
  ): Promise<IndexedDomainSummary | undefined>;

  /**
   * Check if a domain exists in the index.
   *
   * @param domainName - Domain name to check
   * @returns True if domain exists in index
   */
  domainExistsInIndex?(domainName: PunycodeDomainName): Promise<boolean>;
}

/**
 * No-op implementation of domain index functions.
 * Use this when you don't need domain indexing.
 */
export const noopDomainIndexFunctions: DomainIndexFunctions = {
  async addDomainsToIndex(_domains) {
    return 0;
  },
  async removeDomainsFromIndex(_domainNames) {
    return 0;
  },
  async listDomainsInIndex(_options) {
    return { domains: [], total: 0 };
  },
  async updateDomainsInIndex(_domains) {
    return 0;
  },
};

/**
 * In-memory implementation of domain index functions.
 * Useful for testing or simple use cases.
 */
export function createInMemoryDomainIndex(): DomainIndexFunctions & {
  /** Get all domains in the index (for testing) */
  getAll(): IndexedDomainSummary[];
  /** Clear all domains from the index (for testing) */
  clear(): void;
} {
  const domains = new Map<string, IndexedDomainSummary>();

  return {
    async addDomainsToIndex(newDomains) {
      let added = 0;
      for (const domain of newDomains) {
        if (!domains.has(domain.domainName)) {
          domains.set(domain.domainName, domain);
          added++;
        }
      }
      return added;
    },

    async removeDomainsFromIndex(domainNames) {
      let removed = 0;
      for (const name of domainNames) {
        if (domains.delete(name)) {
          removed++;
        }
      }
      return removed;
    },

    async listDomainsInIndex(options) {
      let result = Array.from(domains.values());

      // Apply filters
      if (options?.accountKey) {
        result = result.filter((d) => d.accountKey === options.accountKey);
      }
      if (options?.customerId) {
        result = result.filter((d) => d.customerId === options.customerId);
      }
      if (options?.tld) {
        result = result.filter((d) => d.domainName.endsWith(`.${options.tld}`));
      }
      if (!options?.includeExpired) {
        const now = new Date();
        result = result.filter(
          (d) => !d.expirationDate || d.expirationDate > now,
        );
      }

      const total = result.length;

      // Apply pagination
      const offset = options?.offset ?? 0;
      const limit = options?.limit ?? 100;
      result = result.slice(offset, offset + limit);

      return { domains: result, total };
    },

    async updateDomainsInIndex(updates) {
      let updated = 0;
      for (const domain of updates) {
        if (domains.has(domain.domainName)) {
          domains.set(domain.domainName, {
            ...domains.get(domain.domainName),
            ...domain,
          });
          updated++;
        }
      }
      return updated;
    },

    async getDomainFromIndex(domainName) {
      return domains.get(domainName);
    },

    async domainExistsInIndex(domainName) {
      return domains.has(domainName);
    },

    getAll() {
      return Array.from(domains.values());
    },

    clear() {
      domains.clear();
    },
  };
}
