import NodeCache from '@cacheable/node-cache';
import Bottleneck from 'bottleneck';
import pino from 'pino';
import {
  createEppClient,
  closeClient,
  sendCommand,
  buildDomainCheckCommand,
  buildDomainInfoCommand,
  buildDomainCreateCommand,
  buildDomainRenewCommand,
  buildDomainTransferCommand,
  buildFeeCheckExtension,
  buildSecDnsAddExtension,
  DOMAIN_NS,
  CONTACT_NS,
  HOST_NS,
  type EppClientRuntime,
} from '@namefi-astra/epp-client';
import type {
  ContactsMap,
  DnssecKey,
  DomainContacts,
  DomainOwnershipOperation,
  DomainPricingDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  Nameservers,
  PricingDetails,
  RdapDomainStatus,
  RenewOption,
} from '#lib/abstract-registrar';
import {
  AbstractRegistrarService,
  DomainAvailability,
  type DomainContactPrivacyEnum,
  OperationStatus,
  OperationType,
  singleYearPricingTemplate,
} from '#lib/abstract-registrar';
import type {
  DomainQueryResult,
  LongRunningOperationResult,
  RegisterDomainInput,
  RenewDomainInput,
  TransferDomainInput,
} from '#lib/abstract-registrar/registrar-service';
import {
  type PunycodeDomainName,
  assertPunycodeDomainName,
  toPunycodeDomainName,
} from '#lib/data/validations';
import { Registrars } from '../registrars-keys';
import type { CentralNicConfig } from './types';
import {
  EPP_NAMESPACES,
  EPP_CLIENT_DOMAIN_STATUSES,
  EPP_ERROR_CODES,
} from './types';
import {
  handleEppResult,
  parseDomainCheckResponse,
  parseMultipleDomainCheckResponse,
  parseDomainInfoResponse,
  parseCreateResponse,
  parseRenewResponse,
  parseTransferResponse,
  parseUpdateResponse,
  parseFeeResponse,
  mapEppStatusToRdap,
  mapOperationToFeeCommand,
  generateAuthCode,
  extractEppStatuses,
  generateOperationId,
  parseOperationId,
  getResultCode,
  getResultMessage,
  getResData,
  parseTransferQueryResponse,
} from './helpers';
import {
  type DomainIndexFunctions,
  noopDomainIndexFunctions,
} from './domain-index';
import {
  buildChangeNsCommand,
  buildDomainUpdateCommand,
  buildToggleLockTransferCommand,
} from '../../../../epp-client/src/client/commands/domain/update';
import { buildSecDnsClearExtension } from '../../../../epp-client/src/client/commands/extensions/secDns/update';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { differenceInMinutes, formatDate } from 'date-fns';
import { signMessage } from '#lib/sign-message';

function supportsContacts(tld: string) {
  return tld !== 'pw';
}

/**
 * CentralNic EPP Registrar Service.
 *
 * Implements the AbstractRegistrarService interface using the EPP protocol
 * to communicate with CentralNic registry.
 *
 * Key features:
 * - Persistent connection pool with auto-login/logout
 * - Rate limiting at 200 req/s (configurable)
 * - Domain index integration for inventory management
 * - Structured error handling
 */
export class CentralNicRegistrarService extends AbstractRegistrarService {
  readonly logger: pino.Logger;
  private readonly config: CentralNicConfig;

  /** Persistent EPP client with connection pooling */
  private client: EppClientRuntime | null = null;
  private clientPromise: Promise<EppClientRuntime> | null = null;

  /** Domain index functions for inventory management */
  private readonly domainIndex: DomainIndexFunctions;

  /** Price cache with 12-hour TTL */
  private readonly priceCache: NodeCache = new NodeCache({
    stdTTL: 60 * 60 * 12, // 12 hours
    checkperiod: 60 * 60 * 12,
    deleteOnExpire: true,
  });

  /** Rate limiter: 200 req/s default, configurable */
  private readonly limiter: Bottleneck;

  constructor(config: CentralNicConfig) {
    super(Registrars.CentralNic);
    this.config = config;
    this.logger =
      config.customLogger ?? pino({ name: CentralNicRegistrarService.name });

    // Setup domain index (use noop if not provided)
    this.domainIndex = config.domainIndex ?? noopDomainIndexFunctions;

    // Setup rate limiter: 200 req/s = 5ms minimum between requests
    const rateLimit = config.rateLimit;
    const maxRequestsPerSecond = rateLimit?.maxRequestsPerSecond ?? 200;
    const minTime = Math.ceil(1000 / maxRequestsPerSecond);

    this.limiter = new Bottleneck({
      maxConcurrent: rateLimit?.maxConcurrent ?? 50,
      minTime,
      reservoir: maxRequestsPerSecond, // Token bucket
      reservoirRefreshAmount: maxRequestsPerSecond,
      reservoirRefreshInterval: 1000, // Refill every second
      ...(rateLimit?.redisConnection
        ? { connection: rateLimit.redisConnection }
        : config.connection
          ? { connection: config.connection }
          : {}),
    });

    this.logger.info(
      {
        host: config.host,
        tlds: config.supportedTlds.length,
        maxRequestsPerSecond,
        maxConcurrent: rateLimit?.maxConcurrent ?? 50,
        poolMin: config.pool?.min ?? 1,
        poolMax: config.pool?.max ?? 5,
      },
      'CentralNicRegistrarService initialized',
    );
  }

  /**
   * Get or create the EPP client with connection pooling.
   * Client is created lazily on first use.
   */
  private async getClient(): Promise<EppClientRuntime> {
    if (this.client) {
      return this.client;
    }

    // Prevent multiple concurrent client creations
    if (this.clientPromise) {
      return this.clientPromise;
    }

    this.clientPromise = this.createClient();

    try {
      this.client = await this.clientPromise;
      return this.client;
    } finally {
      this.clientPromise = null;
    }
  }

  /**
   * Create a new EPP client with connection pooling.
   */
  private async createClient(): Promise<EppClientRuntime> {
    const poolConfig = this.config.pool;

    const client = await createEppClient({
      connection: {
        host: this.config.host,
        port: this.config.port ?? 700,
        tls: this.config.tls ?? true,
      },
      credentials: {
        clID: this.config.clID,
        pw: this.config.pw,
      },
      session: {
        version: '1.0',
        lang: 'en',
        services: {
          objURIs: [DOMAIN_NS, CONTACT_NS, HOST_NS],
          extURIs: [EPP_NAMESPACES.FEE, EPP_NAMESPACES.SECDNS],
        },
      },
      autoLogin: true,
      autoLogout: true,
      pool: {
        min: poolConfig?.min ?? 1,
        max: poolConfig?.max ?? 5,
        acquireTimeoutMs: poolConfig?.acquireTimeoutMs ?? 30000,
        idleTimeoutMs: poolConfig?.idleTimeoutMs ?? 600000,
      },
      logXml: this.config.logXml ?? false,
      logParsed: this.config.logParsed ?? false,
      logger: this.logger,
    });

    this.logger.info('EPP client created with connection pool');
    return client;
  }

  /**
   * Execute a command with rate limiting.
   * Unlike the old withClient pattern, this reuses the persistent connection pool.
   */
  private async executeCommand<T>(
    fn: (client: EppClientRuntime) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient();
    return this.limiter.schedule(() => fn(client));
  }

  /**
   * Close the EPP client and release resources.
   * Call this when the service is no longer needed.
   */
  async close(): Promise<void> {
    if (this.client) {
      await closeClient(this.client);
      this.client = null;
      this.logger.info('EPP client closed');
    }
  }

  // ============ Domain Search & Availability ============

  async searchForDomain(query: string): Promise<DomainQueryResult> {
    assertPunycodeDomainName(query as PunycodeDomainName);

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainCheckCommand([query], {
          extension: buildFeeCheckExtension(),
        }),
      );

      return handleEppResult(result, (data) =>
        parseDomainCheckResponse(data, query),
      );
    });
  }

  isSupportedDomain(domain: string): boolean {
    return this.config.supportedTlds.some((tld) => domain.endsWith(`.${tld}`));
  }

  async bulkSearch(_queries: string[]): Promise<DomainQueryResult[]> {
    const queries = _queries.map((q) =>
      toPunycodeDomainName(q.toLowerCase().trim()),
    );
    const supportedDomains = queries.filter((q) => this.isSupportedDomain(q));
    this.logger.debug(`Bulk searching for ${queries.length} domains`);
    if (!queries.length) {
      return [];
    }

    if (!supportedDomains.length) {
      return queries.map((q) => ({
        domainName: q,
        available: DomainAvailability.UNAVAILABLE,
        isPremium: false,
        supported: false,
        price: null,
      }));
    }

    for (const q of queries) {
      assertPunycodeDomainName(q as PunycodeDomainName);
    }

    return this.executeCommand(async (client) => {
      try {
        const command = buildDomainCheckCommand(supportedDomains, {
          extension: buildFeeCheckExtension(),
        });
        const result = await sendCommand(client, command);

        return handleEppResult(result as any, (data) => {
          const parsed = parseMultipleDomainCheckResponse(data, queries);
          const mapped = new Map<string, DomainQueryResult>(
            parsed.map((res) => [res.domainName, res]),
          );
          return queries.map(
            (q) =>
              mapped.get(q) ||
              ({
                domainName: q,
                available: DomainAvailability.UNAVAILABLE,
                isPremium: false,
                supported: false,
                price: null,
              } satisfies DomainQueryResult),
          );
        });
      } catch (error) {
        this.logger.error(error, 'Bulk search failed');
        throw error;
      }
    });
  }

  async getSuggestions(
    _query: string,
    _suggestionCount: number,
  ): Promise<DomainSuggestionsQueryResult<string>> {
    // EPP doesn't have a standard suggestions API
    // Return empty results - suggestions should be handled at a higher level
    return {
      result: [],
    };
  }

  // ============ Domain Info & Status ============

  async getDomainDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainRegistration> {
    assertPunycodeDomainName(domainName);

    const registration = await this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainInfoCommand({
          name: domainName,
          hosts: 'all',
        }),
      );

      return handleEppResult(result, (data) => {
        return parseDomainInfoResponse(data, this.config.clID);
      });
    });

    // Update domain index with fresh data
    await this.domainIndex.updateDomainsInIndex([
      {
        domainName,
        accountKey: this.config.accountKey,
        expirationDate: registration.expirationTime
          ? new Date(registration.expirationTime)
          : undefined,
        lastSyncedAt: new Date(),
      },
    ]);

    return registration;
  }

  async getDomainStatus(
    domainName: PunycodeDomainName,
  ): Promise<RdapDomainStatus> {
    assertPunycodeDomainName(domainName);

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainInfoCommand({
          name: domainName,
          hosts: 'all',
        }),
      );

      return handleEppResult(result, (data) => {
        const statuses = extractEppStatuses(data);
        return mapEppStatusToRdap(statuses);
      });
    });
  }

  // ============ Domain Pricing ============

  async getDomainPrice(
    domainName: PunycodeDomainName,
    operation: DomainOwnershipOperation,
  ): Promise<PricingDetails> {
    assertPunycodeDomainName(domainName);

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainCheckCommand([domainName], {
          extension: buildFeeCheckExtension([
            mapOperationToFeeCommand(operation),
          ]),
        }),
      );

      return handleEppResult(result, (data) =>
        parseFeeResponse(data, operation),
      );
    });
  }

  async getDomainPriceDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainPricingDetails> {
    assertPunycodeDomainName(domainName);

    // Check cache first
    const cacheKey = `price:${domainName}`;
    const cached = this.priceCache.get<DomainPricingDetails>(cacheKey);
    if (cached) return cached;

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainCheckCommand([domainName], {
          extension: buildFeeCheckExtension(['create', 'renew', 'transfer']),
        }),
      );

      const checkResult = handleEppResult(result, (data) =>
        parseDomainCheckResponse(data, domainName),
      );

      const pricing: DomainPricingDetails = checkResult.price ?? {
        registrationPrice: singleYearPricingTemplate(0),
        renewalPrice: singleYearPricingTemplate(0),
        importPrice: singleYearPricingTemplate(0),
      };

      this.priceCache.set(cacheKey, pricing);
      return pricing;
    });
  }

  // ============ Domain Registration ============

  async registerDomain(
    args: RegisterDomainInput,
  ): Promise<LongRunningOperationResult> {
    const { domainName, durationInYears } = args;
    assertPunycodeDomainName(domainName);
    const parsed = parseDomainName(domainName);
    if (!parsed.valid) {
      throw new Error(`Invalid domain name: ${domainName}`);
    }

    const result = await this.executeCommand(async (client) => {
      // For now, use a simplified contact handling
      // In production, you would create/lookup contacts first
      const authCode = generateAuthCode();

      const cmdResult = await sendCommand(
        client,
        buildDomainCreateCommand({
          name: domainName,
          period: { value: durationInYears, unit: 'y' },
          authInfo: authCode,
          contacts: supportsContacts(parsed.publicSuffix)
            ? this.config.defaultContacts
            : undefined,
          ns: this.config.defaultNameservers,
        }),
      );

      return handleEppResult(cmdResult, (data) =>
        parseCreateResponse(data, OperationType.REGISTER_DOMAIN, domainName),
      );
    });

    // On successful registration, add to domain index
    if (result.status === OperationStatus.SUCCESSFUL) {
      await this.domainIndex.addDomainsToIndex([
        {
          domainName,
          accountKey: this.config.accountKey,
          lastSyncedAt: new Date(),
        },
      ]);
    }

    return result;
  }

  // ============ Domain Renewal ============

  async renewDomain(
    args: RenewDomainInput,
  ): Promise<LongRunningOperationResult> {
    const { domainName, durationInYears, currentExpirationDate } = args;
    assertPunycodeDomainName(domainName);

    // Format expiration date as YYYY-MM-DD
    const curExpDate = currentExpirationDate.toISOString().split('T')[0];

    const result = await this.executeCommand(async (client) => {
      const cmdResult = await sendCommand(
        client,
        buildDomainRenewCommand({
          name: domainName,
          curExpDate,
          period: { value: durationInYears, unit: 'y' },
        }),
      );

      return handleEppResult(cmdResult, (data) =>
        parseRenewResponse(data, domainName),
      );
    });

    // Update expiration in domain index
    if (result.status === OperationStatus.SUCCESSFUL) {
      const newExpDate = new Date(currentExpirationDate);
      newExpDate.setFullYear(newExpDate.getFullYear() + durationInYears);

      await this.domainIndex.updateDomainsInIndex([
        {
          domainName,
          expirationDate: newExpDate,
          lastSyncedAt: new Date(),
        },
      ]);
    }

    return result;
  }

  // ============ Domain Transfer ============

  async transferDomain(
    args: TransferDomainInput,
  ): Promise<LongRunningOperationResult> {
    const { domainName, authCode } = args;
    assertPunycodeDomainName(domainName);

    const result = await this.executeCommand(async (client) => {
      const cmdResult = await sendCommand(
        client,
        buildDomainTransferCommand({
          op: 'request',
          name: domainName,
          authInfo: authCode,
          period: { value: 1, unit: 'y' },
        }),
      );

      return handleEppResult(cmdResult, (data) =>
        parseTransferResponse(data, domainName),
      );
    });

    // On successful transfer, add to domain index
    if (result.status === OperationStatus.SUCCESSFUL) {
      await this.domainIndex.addDomainsToIndex([
        {
          domainName,
          accountKey: this.config.accountKey,
          lastSyncedAt: new Date(),
        },
      ]);
    }

    return result;
  }

  async retrieveAuthCode(domainName: PunycodeDomainName): Promise<string> {
    assertPunycodeDomainName(domainName);
    const payload = `${formatDate(new Date(), 'yyw')}-${domainName}`;
    const privateKey = Buffer.from(
      process.env.EPP_AUTH_GEN_PRIVATE_KEY ?? '',
      'base64',
    ).toString('utf-8');

    const signedPayload = signMessage({
      message: payload,
      privateKey,
    });

    const authCode = `#z${signedPayload.slice(0, 6)}A1${signedPayload.slice(6, 12)}`;

    return this.executeCommand(async (client) => {
      await sendCommand(
        client,
        buildDomainUpdateCommand({
          name: domainName,
          chg: {
            authInfo: authCode,
          },
        }),
      );

      return authCode;
    });
  }

  // ============ Domain Lock/Unlock ============

  async lockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    const result = await this.executeCommand(async (client) => {
      const cmdResult = await sendCommand(
        client,
        buildToggleLockTransferCommand(domainName, 'lock'),
      );

      return handleEppResult(cmdResult, (data) =>
        parseUpdateResponse(data, OperationType.DOMAIN_CHANGE_LOCK, domainName),
      );
    });

    // Update statuses in domain index
    if (result.status === OperationStatus.SUCCESSFUL) {
      const currentDomain =
        await this.domainIndex.getDomainFromIndex?.(domainName);
      const currentStatuses = currentDomain?.statuses ?? [];
      const newStatuses = [
        ...new Set([
          ...currentStatuses,
          EPP_CLIENT_DOMAIN_STATUSES.CLIENT_TRANSFER_PROHIBITED,
          EPP_CLIENT_DOMAIN_STATUSES.CLIENT_DELETE_PROHIBITED,
        ]),
      ];

      await this.domainIndex.updateDomainsInIndex([
        {
          domainName,
          statuses: newStatuses,
          lastSyncedAt: new Date(),
        },
      ]);
    }

    return result;
  }

  async unlockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    const result = await this.executeCommand(async (client) => {
      const cmdResult = await sendCommand(
        client,
        buildToggleLockTransferCommand(domainName, 'unlock'),
      );

      return handleEppResult(cmdResult, (data) =>
        parseUpdateResponse(data, OperationType.DOMAIN_CHANGE_LOCK, domainName),
      );
    });

    // Update statuses in domain index
    if (result.status === OperationStatus.SUCCESSFUL) {
      const currentDomain =
        await this.domainIndex.getDomainFromIndex?.(domainName);
      const currentStatuses = currentDomain?.statuses ?? [];
      const newStatuses = currentStatuses.filter(
        (s) =>
          s !== EPP_CLIENT_DOMAIN_STATUSES.CLIENT_TRANSFER_PROHIBITED &&
          s !== EPP_CLIENT_DOMAIN_STATUSES.CLIENT_DELETE_PROHIBITED,
      );

      await this.domainIndex.updateDomainsInIndex([
        {
          domainName,
          statuses: newStatuses,
          lastSyncedAt: new Date(),
        },
      ]);
    }

    return result;
  }

  // ============ Nameservers ============

  async getNameServers(domainName: PunycodeDomainName): Promise<Nameservers> {
    const details = await this.getDomainDetails(domainName);
    return details.nameservers ?? [];
  }

  async setNameServers(
    domainName: PunycodeDomainName,
    nameservers: Nameservers,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    // Get current nameservers to know what to remove
    const currentNs = await this.getNameServers(domainName);

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildChangeNsCommand(
          domainName,
          currentNs,
          nameservers.map(toPunycodeDomainName),
        ),
      );

      return handleEppResult(result, (data) =>
        parseUpdateResponse(data, OperationType.UPDATE_NAMESERVER, domainName),
      );
    });
  }

  // ============ DNSSEC ============

  async addDelegationSigner(
    domainName: PunycodeDomainName,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainUpdateCommand(
          { name: domainName },
          { extension: buildSecDnsAddExtension(signingAttributes) },
        ),
      );

      return handleEppResult(result, (data) =>
        parseUpdateResponse(data, OperationType.ADD_DNSSEC, domainName),
      );
    });
  }

  async removeDelegationSigner(
    domainName: PunycodeDomainName,
    publicKeyOrId: string,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    // For EPP, we need the full DS data to remove it
    // This is a simplified version - in production, you'd need to
    // fetch the current DS records and match by keyTag or other identifier
    this.logger.warn(
      { domainName, publicKeyOrId },
      'removeDelegationSigner requires full DS data - using keyTag only',
    );

    return this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainUpdateCommand(
          { name: domainName },
          { extension: buildSecDnsClearExtension() },
        ),
      );

      return handleEppResult(result, (data) =>
        parseUpdateResponse(data, OperationType.REMOVE_DNSSEC, domainName),
      );
    });
  }

  // ============ Domain Contacts ============

  async getDomainContacts(
    domainName: PunycodeDomainName,
  ): Promise<DomainContacts> {
    const details = await this.getDomainDetails(domainName);
    return details.contacts;
  }

  async updateDomainContacts(
    domainName: PunycodeDomainName,
    _contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    // EPP contact updates require creating/updating contact objects first
    // This is a placeholder that returns success
    this.logger.warn(
      { domainName },
      'updateDomainContacts not fully implemented for EPP',
    );

    return {
      operationId: generateOperationId(
        OperationType.UPDATE_DOMAIN_CONTACT,
        domainName,
      ),
      status: OperationStatus.SUCCESSFUL,
      type: OperationType.UPDATE_DOMAIN_CONTACT,
      message: 'Contact update not fully implemented',
      response: null,
    };
  }

  async updateDomainContactsPrivacy(
    domainName: PunycodeDomainName,
    _privacy: ContactsMap<DomainContactPrivacyEnum>,
  ): Promise<LongRunningOperationResult> {
    // EPP handles privacy differently - typically via registry extensions
    this.logger.warn(
      { domainName },
      'updateDomainContactsPrivacy not supported via standard EPP',
    );

    return {
      operationId: generateOperationId(
        OperationType.CHANGE_PRIVACY_PROTECTION,
        domainName,
      ),
      status: OperationStatus.SUCCESSFUL,
      type: OperationType.CHANGE_PRIVACY_PROTECTION,
      message: 'Privacy update not supported via standard EPP',
      response: null,
    };
  }

  // ============ Renew Options ============

  async getRenewOption(_domainName: PunycodeDomainName): Promise<RenewOption> {
    // EPP doesn't have a standard auto-renew concept
    // Return manual by default
    return 'MANUAL' as RenewOption;
  }

  async setRenewOption(
    domainName: PunycodeDomainName,
    option: RenewOption,
  ): Promise<LongRunningOperationResult> {
    // EPP doesn't have a standard auto-renew API
    this.logger.warn(
      { domainName, option },
      'setRenewOption not supported via standard EPP',
    );

    return {
      operationId: generateOperationId(
        OperationType.ENABLE_AUTORENEW,
        domainName,
      ),
      status: OperationStatus.SUCCESSFUL,
      type: OperationType.ENABLE_AUTORENEW,
      message: 'Auto-renew setting not supported via standard EPP',
      response: null,
    };
  }

  // ============ Operation Status ============

  async _checkDomainRegister(
    domainName: PunycodeDomainName,
    operationId: string,
    timestamp: Date,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    const response = await this.executeCommand(async (client) => {
      const result = await sendCommand(
        client,
        buildDomainInfoCommand({
          name: domainName,
          hosts: 'all',
        }),
      );

      if (result.ok) {
        let parsed: DomainRegistration | undefined;
        try {
          parsed = parseDomainInfoResponse(result.data, this.config.clID);
        } catch (error) {
          console.error(error);
        }

        return {
          resultCode: getResultCode(result.data),
          resultMessage: getResultMessage(result.data),
          resultData: getResData(result.data),
          parsedData: parsed,
        };
      }
    });

    // NOTE: Check if the operation is within the 30-minute window after submission as per Dynadot recommendation
    const isWithin30MinsAfterSubmission =
      differenceInMinutes(new Date(), timestamp) <
      DOMAIN_REGISTER_CHECK_TIME_WINDOW_IN_MINUTES;

    if (response?.resultCode === EPP_ERROR_CODES.OBJECT_DOES_NOT_EXIST) {
      // NOTE: If the domain is not found in your account, check if the operation is within the 30-minute window after submission as per Dynadot recommendation
      if (isWithin30MinsAfterSubmission) {
        return {
          status: OperationStatus.IN_PROGRESS,
          response: response,
          operationId,
          type: OperationType.REGISTER_DOMAIN,
        };
      }
      return {
        status: OperationStatus.FAILED,
        response: response,
        operationId,
        type: OperationType.REGISTER_DOMAIN,
        message: response.resultMessage,
      };
    }
    if (response?.parsedData?.creationTime) {
      // check owner and time
      return {
        status: OperationStatus.SUCCESSFUL,
        response: response,
        operationId,
        type: OperationType.REGISTER_DOMAIN,
      };
    }
    return {
      status: OperationStatus.IN_PROGRESS,
      response: response,
      operationId,
      type: OperationType.REGISTER_DOMAIN,
    };
  }

  async _getTransferStatus(domainName: PunycodeDomainName) {
    assertPunycodeDomainName(domainName);
    return this.executeCommand(async (client) => {
      const res = await sendCommand(
        client,
        buildDomainTransferCommand({ name: domainName, op: 'query' }),
      );
      return handleEppResult(res, parseTransferQueryResponse);
    });
  }
  async getOperationStatus(
    domainNameLdh: PunycodeDomainName,
    operationId: string,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainNameLdh);

    const { operationType, domainName, extraData, timestamp } =
      parseOperationId(operationId);
    this.logger.debug({
      method: 'getOperationStatus',
      operationType,
      domainName,
      extraData,
    });
    switch (operationType) {
      case OperationType.REGISTER_DOMAIN: {
        return Promise.resolve(
          this._checkDomainRegister(
            domainNameLdh,
            operationId,
            new Date(timestamp),
          ),
        );
      }
      case OperationType.TRANSFER_IN_DOMAIN: {
        const { isPending, isApproved, isRejected, message, response } =
          await this._getTransferStatus(domainNameLdh);
        let status: OperationStatus = OperationStatus.SUBMITTED;

        if (isPending) {
          status = OperationStatus.IN_PROGRESS;
        } else if (isRejected) {
          status = OperationStatus.FAILED;
        } else if (isApproved) {
          status = OperationStatus.SUCCESSFUL;
        }

        return Promise.resolve({
          type: operationType,
          operationId,
          response: { message, response },
          status,
        });
      }
      case OperationType.RENEW_DOMAIN:
      case OperationType.DOMAIN_CHANGE_LOCK:
      case OperationType.ADD_DNSSEC:
      case OperationType.REMOVE_DNSSEC:
      case OperationType.ENABLE_AUTORENEW:
      case OperationType.DISABLE_AUTORENEW:
      case OperationType.CHANGE_PRIVACY_PROTECTION:
      case OperationType.UPDATE_DOMAIN_CONTACT:
      case OperationType.UPDATE_NAMESERVER:
        return Promise.resolve({
          type: operationType,
          operationId,
          response: {},
          status: extraData?.status,
        });
      default:
        return Promise.resolve({
          type: operationType,
          operationId,
          response: {},
          status: OperationStatus.FAILED,
        });
    }
  }

  // ============ Domain Listing ============

  /**
   * List all domains from the domain index.
   * Since EPP doesn't support listing, we use the index and verify with bulk checks.
   */
  async listAllDomains(): Promise<DomainSummary[]> {
    // Get domains from index
    const { domains } = await this.domainIndex.listDomainsInIndex({
      accountKey: this.config.accountKey,
    });

    if (domains.length === 0) {
      return [];
    }

    // Verify domains still exist via bulk check
    const domainNames = domains.map((d) => d.domainName);

    // Check in batches of 50
    const batchSize = 50;
    const verifiedDomains: DomainSummary[] = [];

    for (let i = 0; i < domainNames.length; i += batchSize) {
      const batch = domainNames.slice(i, i + batchSize);
      const checkResults = await this.bulkSearch(batch);

      for (const result of checkResults) {
        // Domain exists if it's NOT available
        if (result.available === 'UNAVAILABLE') {
          const indexed = domains.find(
            (d) => d.domainName === result.domainName,
          );
          verifiedDomains.push({
            domainName: result.domainName as PunycodeDomainName,
            expirationTime: indexed?.expirationDate ?? new Date(),
            autoRenewOption: 'MANUAL' as RenewOption,
            transferLocked: false, // Would need to check domain statuses
          });
        }
      }
    }

    return verifiedDomains;
  }

  /**
   * List expired domains from the domain index.
   */
  async listExpiredDomains(): Promise<{ domainName: PunycodeDomainName }[]> {
    const { domains } = await this.domainIndex.listDomainsInIndex({
      accountKey: this.config.accountKey,
      includeExpired: true,
    });

    const now = new Date();
    return domains
      .filter((d) => d.expirationDate && d.expirationDate < now)
      .map((d) => ({ domainName: d.domainName }));
  }

  async getAllowedParentDomains(): Promise<PunycodeDomainName[]> {
    return this.config.supportedTlds.map(
      (tld) => `.${tld}` as PunycodeDomainName,
    );
  }
}
const DOMAIN_REGISTER_CHECK_TIME_WINDOW_IN_MINUTES = 30;
