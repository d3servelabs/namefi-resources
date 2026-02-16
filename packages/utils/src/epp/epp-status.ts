function normalizeStatusKey(status: string): string {
  return status
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

type CanonicalStatus = {
  epp: EppStatus;
  rdap: RdapStatus;
};

const EPP_TO_RDAP_STATUS = {
  addPeriod: 'add period',
  autoRenewPeriod: 'auto renew period',
  clientDeleteProhibited: 'client delete prohibited',
  clientHold: 'client hold',
  clientRenewProhibited: 'client renew prohibited',
  clientTransferProhibited: 'client transfer prohibited',
  clientUpdateProhibited: 'client update prohibited',
  inactive: 'inactive',
  ok: 'ok',
  pendingCreate: 'pending create',
  pendingDelete: 'pending delete',
  pendingRenew: 'pending renew',
  pendingRestore: 'pending restore',
  pendingTransfer: 'pending transfer',
  pendingUpdate: 'pending update',
  redemptionPeriod: 'redemption period',
  renewPeriod: 'renew period',
  serverDeleteProhibited: 'server delete prohibited',
  serverHold: 'server hold',
  serverRenewProhibited: 'server renew prohibited',
  serverTransferProhibited: 'server transfer prohibited',
  serverUpdateProhibited: 'server update prohibited',
  transferPeriod: 'transfer period',
} as const;

type EppStatus = keyof typeof EPP_TO_RDAP_STATUS;
type RdapStatus = (typeof EPP_TO_RDAP_STATUS)[keyof typeof EPP_TO_RDAP_STATUS];

const CANONICAL_STATUS_BY_NORMALIZED = Object.fromEntries(
  Object.entries(EPP_TO_RDAP_STATUS).map(([epp, rdap]) => [
    normalizeStatusKey(epp),
    { epp, rdap },
  ]),
) as Record<string, CanonicalStatus>;

const CLIENT_OR_SERVER_SHARED_STATUS_TO_SPACED = {
  deleteProhibited: 'delete prohibited',
  hold: 'hold',
  renewProhibited: 'renew prohibited',
  transferProhibited: 'transfer prohibited',
  updateProhibited: 'update prohibited',
} as const;

type ClientOrServerSharedStatusCamel =
  keyof typeof CLIENT_OR_SERVER_SHARED_STATUS_TO_SPACED;

type ClientOrServerSharedStatusSpaced =
  (typeof CLIENT_OR_SERVER_SHARED_STATUS_TO_SPACED)[ClientOrServerSharedStatusCamel];

/**
 * Shared client/server EPP status suffix accepted by {@link EppStatuses.hasClientOrServerStatus}.
 *
 * Supports both camelCase and RDAP lowercase-space forms.
 */
export type ClientOrServerSharedStatus =
  | ClientOrServerSharedStatusCamel
  | ClientOrServerSharedStatusSpaced;

const CLIENT_OR_SERVER_SHARED_STATUSES_NORMALIZED = new Set(
  Object.keys(CLIENT_OR_SERVER_SHARED_STATUS_TO_SPACED).map((status) =>
    normalizeStatusKey(status),
  ),
);

/**
 * Unifies EPP/WHOIS (camelCase) and RDAP (lowercase-space) domain statuses.
 */
export class EppStatuses {
  private readonly statuses = new Set<string>();

  private constructor() {}

  /**
   * Creates an EPP status container from raw WHOIS/RDAP/EPP status strings.
   * ignores unknown statuses
   *
   * All statuses are normalized internally to lowercase without spaces, `_`, or `-`
   * so checks are format-insensitive.
   */
  static fromArray(statuses: readonly string[] = []) {
    const instance = new EppStatuses();
    for (const status of statuses) {
      instance.setStatus(status, true);
    }
    return instance;
  }

  /**
   * Creates an EPP status container from raw WHOIS/RDAP/EPP status strings.
   * throws an error if any status is unknown
   *
   * All statuses are normalized internally to lowercase without spaces, `_`, or `-`
   * so checks are format-insensitive.
   */
  static fromArrayOrThrow(statuses: readonly string[] = []) {
    const instance = new EppStatuses();
    for (const status of statuses) {
      instance.setStatusOrThrow(status, true);
    }
    return instance;
  }

  /**
   * Returns statuses in WHOIS/EPP camelCase form.
   *
   * WHOIS and EPP values are aligned for this utility.
   */
  getWhoisStatuses(): EppStatus[] {
    return this.getEppStatuses();
  }

  /**
   * Returns statuses in canonical EPP camelCase form.
   */
  getEppStatuses(): EppStatus[] {
    return this.getStatusesByFormat('epp');
  }

  /**
   * Returns statuses in canonical RDAP lowercase-space form.
   */
  getRdapStatuses(): RdapStatus[] {
    return this.getStatusesByFormat('rdap');
  }

  /**
   * Alias for {@link getRdapStatuses}.
   */
  // biome-ignore lint/style/useNamingConvention: keep acronymed API for caller convenience.
  getRDAPStatuses(): string[] {
    return this.getRdapStatuses();
  }

  /**
   * Checks whether a status exists in this set.
   *
   * Input is normalized before comparison, so casing and separators do not matter.
   */
  hasStatus(status: EppStatus | RdapStatus | string): boolean {
    return this.statuses.has(normalizeStatusKey(status));
  }

  /**
   * Checks shared lock-style statuses across both client and server variants.
   *
   * Example:
   * - `transfer prohibited` matches `clientTransferProhibited` or `serverTransferProhibited`
   * - `transferProhibited` matches the same variants
   */
  hasClientOrServerStatus(status: ClientOrServerSharedStatus): boolean {
    const normalizedSharedStatus = normalizeStatusKey(status);
    if (
      !CLIENT_OR_SERVER_SHARED_STATUSES_NORMALIZED.has(normalizedSharedStatus)
    ) {
      return false;
    }

    return (
      this.statuses.has(`client${normalizedSharedStatus}`) ||
      this.statuses.has(`server${normalizedSharedStatus}`)
    );
  }

  /**
   * Adds or removes a status.
   * ignores unknown statuses
   *
   * @param status Raw status in WHOIS/RDAP/EPP format
   * @param enabled When `true`, status is added; when `false`, status is removed
   * @returns The same instance for chaining
   */
  setStatus(status: string, enabled = true): this {
    const normalizedStatus = normalizeStatusKey(status);
    if (!(normalizedStatus in CANONICAL_STATUS_BY_NORMALIZED)) {
      console.warn(`EppStatuses.setStatus: Unknown status=${status}`);
      return this;
    }

    if (enabled) {
      this.statuses.add(normalizedStatus);
    } else {
      this.statuses.delete(normalizedStatus);
    }

    return this;
  }

  /**
   * Adds or removes a status. throws an error if the status is unknown
   *
   * @param status Raw status in WHOIS/RDAP/EPP format
   * @param enabled When `true`, status is added; when `false`, status is removed
   * @returns The same instance for chaining
   */
  setStatusOrThrow(status: string, enabled = true): this {
    const normalizedStatus = normalizeStatusKey(status);
    if (!(normalizedStatus in CANONICAL_STATUS_BY_NORMALIZED)) {
      console.warn(`EppStatuses.setStatus: Unknown status=${status}`);
      const error = new Error(`Unknown status=${status}`);
      error.name = 'EppStatusesUnknownStatusError';
      throw error;
    }

    return this.setStatus(status, enabled);
  }

  private getStatusesByFormat<K extends keyof CanonicalStatus>(
    format: K,
  ): CanonicalStatus[K][] {
    return Array.from(this.statuses, (status) => {
      const canonicalStatus = CANONICAL_STATUS_BY_NORMALIZED[status];
      return canonicalStatus[format];
    }) as CanonicalStatus[K][];
  }
}
