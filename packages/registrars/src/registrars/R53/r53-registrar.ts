import punycode from 'node:punycode';
import {
  AssociateDelegationSignerToDomainCommand,
  CheckDomainAvailabilityCommand,
  CheckDomainTransferabilityCommand,
  DisableDomainAutoRenewCommand,
  DisableDomainTransferLockCommand,
  DisassociateDelegationSignerFromDomainCommand,
  EnableDomainAutoRenewCommand,
  EnableDomainTransferLockCommand,
  GetDomainDetailCommand,
  GetDomainSuggestionsCommand,
  GetOperationDetailCommand,
  ListDomainsCommand,
  ListOperationsCommand,
  ListPricesCommand,
  RegisterDomainCommand,
  RenewDomainCommand,
  RetrieveDomainAuthCodeCommand,
  Route53DomainsClient,
  Route53DomainsServiceException,
  TransferDomainCommand,
  UpdateDomainContactCommand,
  UpdateDomainContactPrivacyCommand,
  UpdateDomainNameserversCommand,
} from '@aws-sdk/client-route-53-domains';
import { assertNotNil } from '@namefi-astra/utils';
import pino from 'pino';
import { AbstractRegistrarService } from '#lib/abstract-registrar';
import type {
  ContactsMap,
  DnssecKey,
  DomainContacts,
  DomainPricingDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  DomainQueryResult,
  LongRunningOperationResult,
  Nameserver,
  Nameservers,
  PendingTransferInfo,
  PricingDetails,
  RdapDomainStatus,
  RegisterDomainInput,
  ResubmitImportDomainRequestInput,
  CancelImportDomainRequestInput,
  RenewDomainInput,
  TransferDomainInput,
  VerifyImportAuthCodeOutput,
} from '#lib/abstract-registrar';
import {
  DomainAvailability,
  DomainContactPrivacyEnum,
  DomainOwnershipOperation,
  OperationStatus,
  OperationType,
  RenewOption,
} from '#lib/abstract-registrar';
import { toPunycodeDomainName } from '#lib/data/validations';
import { IdnLanguageCodeISO639_2 } from '#lib/idn/idn-language-code';
import { supportsDnssec } from '#lib/supports-dnssec';
import { Registrars } from '../registrars-keys';

import type {
  DomainPrice,
  ListDomainsCommandInput,
  ListDomainsCommandOutput,
  ListOperationsCommandInput,
  ListOperationsCommandOutput,
  ListPricesCommandInput,
  ListPricesCommandOutput,
  RegisterDomainCommandInput,
  RegisterDomainCommandOutput,
  RenewDomainCommandOutput,
  TransferDomainCommandInput,
} from '@aws-sdk/client-route-53-domains';
import { indexBy, isNil, groupBy } from 'ramda';
import type { PunycodeDomainName } from '#lib/data/validations';
import { assertPunycodeDomainName } from '#lib/data/validations';
import {
  fromR53DomainInfo,
  fromR53DomainPrice,
  toR53Contact,
  toR53ContactsMap,
} from './helpers';
import pMap from 'p-map';
import { getTldFromDomainName } from '#lib/get-tld';
import NodeCache from '@cacheable/node-cache';
import Bottleneck from 'bottleneck';
import crypto from 'crypto';

let limiter: Bottleneck;

function setupLimiter({
  connection,
}: {
  connection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;
}) {
  const logger = pino({
    name: 'R53Limiter',
  }).child({
    context: {
      id: 'r53-registrar',
    },
  });

  if (limiter) {
    return limiter;
  }

  limiter = new Bottleneck({
    id: 'r53-registrar',
    reservoir: 4, // initial available tokens
    reservoirRefreshAmount: 4, // refill 4 tokens...
    reservoirRefreshInterval: 1000, // ...every 1000 ms (1 second)
    connection,
    maxConcurrent: 2,
    minTime: 200,
  });

  limiter.on('failed', async (error, jobInfo) => {
    const id = jobInfo.options.id;
    logger.warn(`Job ${id} failed: ${error}`);
    if (jobInfo.retryCount > 5) {
      logger.debug('Job failed too many times, skipping');
      return;
    }

    if (error instanceof Route53DomainsServiceException) {
      if (
        error.name === 'ThrottlingException' ||
        error.message.includes('Rate exceeded') ||
        error.name === 'TimeoutError' ||
        (error as any).code === 'ETIMEDOUT'
      ) {
        const delay = crypto.randomInt(1500, 4000);
        return delay;
      }
      logger.warn({ error }, 'R53 error');
    } else {
      logger.warn({ error }, 'Other error');
    }
  });
  limiter.on('error', (error) => {
    logger.debug({ error }, 'Limiter error');
  });

  limiter?.connection?.on('error', (error) => {
    logger.error({ error }, 'Redis connection error');
  });
}

function getRequiredActionFromMessage(message?: string) {
  const lower = message?.toLowerCase() ?? '';
  if (lower.includes('auth')) {
    return 'EPP_AUTH_CODE_UPDATE_REQUIRED' as const;
  }
  if (lower.includes('lock') || lower.includes('transfer prohibited')) {
    return 'EPP_UNLOCK_REQUIRED' as const;
  }
  return 'UNDETERMINED';
}

export class R53RegistrarService extends AbstractRegistrarService {
  client: Route53DomainsClient;

  // In memory cache for prices
  cache: NodeCache = new NodeCache({
    stdTTL: 60 * 60 * 12, // 12 hours in seconds
    checkperiod: 60 * 60 * 12, // 12 hours in seconds
    deleteOnExpire: true,
  });
  readonly logger: pino.Logger;

  private get priceMap(): Record<
    string,
    NonNullable<ListPricesCommandOutput['Prices']>[number]
  > {
    return this.cache.get('tld_prices') ?? {};
  }

  send: Route53DomainsClient['send'];

  constructor({
    region,
    accessKeyId,
    secretAccessKey,
    customLogger,
    connection,
  }: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    customLogger?: pino.Logger;
    connection?: Bottleneck.IORedisConnection | Bottleneck.RedisConnection;
  }) {
    super(Registrars.Route53);
    this.logger = customLogger ?? pino({ name: R53RegistrarService.name });
    this.logger.debug('R53RegistrarService constructor');
    setupLimiter({ connection });

    this.client = new Route53DomainsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.send = this.client.send.bind(this.client);
    limiter.ready().then(() => {
      this.logger.debug('Limiter ready');

      this.send = limiter.wrap(this.client.send.bind(this.client));
      this.cache.on('expired', async () => {
        this.logger.debug('prices cache expired');
        await this._updatePrices();
      });
      this.getAllowedParentDomains().then((tlds) => {
        this.logger.debug({ tlds: tlds.length }, 'R53 allowed parent domains');
      });
    });
  }

  async getAllowedParentDomains(): Promise<PunycodeDomainName[]> {
    if (Object.keys(this.priceMap).length === 0) {
      await this._updatePrices();
    }
    return Object.keys(this.priceMap).map((tld) => toPunycodeDomainName(tld));
  }

  async registerDomain(
    args: RegisterDomainInput,
  ): Promise<LongRunningOperationResult<RegisterDomainCommandOutput>> {
    //todo validate price
    const { domainName, durationInYears, renewOption } = args;
    assertPunycodeDomainName(domainName);

    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    const contacts = toR53ContactsMap(args.contacts);
    const input: RegisterDomainCommandInput = {
      IdnLangCode: IdnLanguageCodeISO639_2(domainName),
      DomainName: punycode.toASCII(domainName), // required
      DurationInYears: durationInYears || 1, // required
      AutoRenew: renewOption === RenewOption.AUTOMATIC,
      PrivacyProtectAdminContact: privacy,
      PrivacyProtectRegistrantContact: privacy,
      PrivacyProtectTechContact: privacy,
      RegistrantContact: contacts.RegistrantContact,
      AdminContact: contacts.AdminContact || contacts.RegistrantContact,
      TechContact: contacts.TechContact || contacts.RegistrantContact,
    };
    const command = new RegisterDomainCommand(input);

    const response = await this.send(command);

    return {
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
      type: OperationType.REGISTER_DOMAIN,
    };
  }

  async renewDomain(
    args: RenewDomainInput,
  ): Promise<LongRunningOperationResult<RenewDomainCommandOutput>> {
    assertPunycodeDomainName(args.domainName);

    const command = new RenewDomainCommand({
      DomainName: args.domainName,
      DurationInYears: args.durationInYears,
      CurrentExpiryYear: args.currentExpirationDate.getFullYear(),
    });
    const response = await this.send(command);
    return {
      type: OperationType.RENEW_DOMAIN,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async transferDomain(
    args: TransferDomainInput,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(args.domainName);

    const { domainName, authCode } = args;
    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    const contacts = toR53ContactsMap(args.contacts);

    const transferability = await this.send(
      new CheckDomainTransferabilityCommand({
        DomainName: domainName,
        AuthCode: authCode,
      }),
    );
    const transferabilityStatus =
      transferability.Transferability?.Transferable ?? 'DONT_KNOW';
    const transferabilityMessage = transferability.Message;

    if (transferabilityStatus !== 'TRANSFERABLE') {
      const actionType = getRequiredActionFromMessage(transferabilityMessage);

      if (actionType) {
        return {
          type: OperationType.TRANSFER_IN_DOMAIN,
          status: OperationStatus.REQUIRES_ACTION,
          response: transferability,
          message: transferabilityMessage,
          metadata: {
            actionType,
          } as const,
        };
      }

      return {
        type: OperationType.TRANSFER_IN_DOMAIN,
        status: OperationStatus.FAILED,
        response: transferability,
        message: transferabilityMessage,
      };
    }

    const input: TransferDomainCommandInput = {
      IdnLangCode: IdnLanguageCodeISO639_2(domainName),
      DomainName: domainName, // required
      DurationInYears: 1, // required
      AutoRenew: true,
      RegistrantContact: contacts.RegistrantContact,
      AdminContact: contacts.AdminContact || contacts.RegistrantContact,
      TechContact: contacts.TechContact || contacts.RegistrantContact,
      PrivacyProtectAdminContact: privacy,
      PrivacyProtectRegistrantContact: privacy,
      PrivacyProtectTechContact: privacy,
      AuthCode: authCode,
    };
    try {
      const response = await this.send(new TransferDomainCommand(input));

      return {
        type: OperationType.TRANSFER_IN_DOMAIN,
        operationId: response.OperationId,
        status: OperationStatus.SUBMITTED,
        response,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const actionType = getRequiredActionFromMessage(message);
      if (actionType) {
        return {
          type: OperationType.TRANSFER_IN_DOMAIN,
          status: OperationStatus.REQUIRES_ACTION,
          response: { error },
          message,
          metadata: {
            actionType,
          } as const,
        };
      }
      throw error;
    }
  }

  async resubmitImportDomainRequest(
    args: ResubmitImportDomainRequestInput,
  ): Promise<LongRunningOperationResult<any>> {
    return this.transferDomain(args);
  }

  async cancelImportDomainRequest(
    args: CancelImportDomainRequestInput,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(args.domainName);

    return {
      type: OperationType.TRANSFER_IN_DOMAIN,
      status: OperationStatus.ERROR,
      response: {},
      message: 'Not supported',
    };
  }

  async retrieveAuthCode(domainName: PunycodeDomainName): Promise<string> {
    assertPunycodeDomainName(domainName);

    const res = await this.send(
      new RetrieveDomainAuthCodeCommand({
        DomainName: domainName,
      }),
    );
    assertNotNil(res.AuthCode, 'Auth code is not available');
    return res.AuthCode;
  }

  async verifyAuthCode(
    domainName: PunycodeDomainName,
    authCode: string,
  ): Promise<VerifyImportAuthCodeOutput> {
    assertPunycodeDomainName(domainName);

    const response = await this.send(
      new CheckDomainTransferabilityCommand({
        DomainName: domainName,
        AuthCode: authCode,
      }),
    );
    assertNotNil(response.Transferability, 'Transferability is not available');
    const transferable =
      response.Transferability.Transferable === 'TRANSFERABLE';

    return {
      transferable,
      response,
      reason:
        response.Message || transferable
          ? undefined
          : (response.Transferability as string),
    };
  }

  async lockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.send(
      new EnableDomainTransferLockCommand({
        DomainName: domainName,
      }),
    );
    return {
      type: OperationType.DOMAIN_CHANGE_LOCK,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async unlockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.send(
      new DisableDomainTransferLockCommand({
        DomainName: domainName,
      }),
    );

    return {
      type: OperationType.DOMAIN_CHANGE_LOCK,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async getDomainDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainRegistration> {
    assertPunycodeDomainName(domainName);

    const response = await this.send(
      new GetDomainDetailCommand({
        DomainName: domainName,
      }),
    );

    return {
      ...fromR53DomainInfo(response),
      supportsDnssec: supportsDnssec(domainName),
    };
  }

  async getDomainStatus(
    domainName: PunycodeDomainName,
  ): Promise<RdapDomainStatus> {
    assertPunycodeDomainName(domainName);

    const command = new GetDomainDetailCommand({
      DomainName: domainName, // required
    });
    const response = await this.send(command);
    assertNotNil(response.StatusList, 'Status list is not available');
    return response.StatusList;
  }

  async getTldPrices(options = { useCachedValue: true }) {
    const response = await this._getAllTldsPricing();
    return Object.fromEntries(
      Object.entries(response).map(([key, value]) => [
        key,
        fromR53DomainPrice(value),
      ]),
    );
  }

  async getDomainPrice(
    domainName: PunycodeDomainName,
    operation: DomainOwnershipOperation,
  ): Promise<PricingDetails> {
    assertPunycodeDomainName(domainName);
    const prices = await this.getDomainPriceDetails(domainName);

    switch (operation) {
      case DomainOwnershipOperation.REGISTER:
        return prices.registrationPrice;
      case DomainOwnershipOperation.RENEW:
        return prices.renewalPrice;
      case DomainOwnershipOperation.TRANSFER:
        return prices.importPrice;
      // case DomainOwnershipOperation.CHANGE_OWNERSHIP:
      //   return prices.changeOwnershipPrice;
      // case DomainOwnershipOperation.RESTORE:
      //   return prices.restorationPrice;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async getDomainPriceDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainPricingDetails> {
    assertPunycodeDomainName(domainName);

    const response = await this._getTldDomainsPricingFromDomainName({
      domainName,
    });
    return fromR53DomainPrice(response);
  }

  async addDelegationSigner(
    domainName: PunycodeDomainName,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const command = new AssociateDelegationSignerToDomainCommand({
      DomainName: domainName,
      SigningAttributes: {
        Algorithm: signingAttributes.algorithm,
        Flags: signingAttributes.flags,
        PublicKey: signingAttributes.publicKey,
      },
    });
    const response = await this.send(command);

    return {
      type: OperationType.ADD_DNSSEC,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async removeDelegationSigner(
    domainName: PunycodeDomainName,
    publicKeyOrId: string,
  ): Promise<LongRunningOperationResult<any>> {
    const response = await this.send(
      new DisassociateDelegationSignerFromDomainCommand({
        DomainName: domainName,
        Id: publicKeyOrId,
      }),
    );

    return {
      type: OperationType.REMOVE_DNSSEC,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async searchForDomain(query: PunycodeDomainName): Promise<DomainQueryResult> {
    assertPunycodeDomainName(query);

    const [searchResults, price] = await Promise.all([
      this.send(
        new CheckDomainAvailabilityCommand({
          DomainName: query, // required
        }),
      ),
      this._getTldDomainsPricingFromDomainName({
        domainName: query,
      }),
    ]);
    return {
      domainName: query,
      price: fromR53DomainPrice(price),
      available:
        searchResults.Availability === 'AVAILABLE'
          ? DomainAvailability.AVAILABLE
          : DomainAvailability.UNAVAILABLE,
      isPremium: false,
      supported: true,
    };
  }

  async bulkSearch(
    queries: PunycodeDomainName[],
    options?: { existingDomains?: PunycodeDomainName[] },
  ): Promise<DomainQueryResult[]> {
    const allowedParentDomains = new Set(await this.getAllowedParentDomains());
    const existingDomains = new Set(options?.existingDomains ?? []);
    const { notSupported = [], supported = [] } = groupBy((query) => {
      if (existingDomains.has(query)) {
        return 'supported';
      }
      const tld = getTldFromDomainName(query);
      if (isNil(tld) || !allowedParentDomains.has(tld)) {
        return 'notSupported';
      }
      return 'supported';
    }, queries);
    const notSupportedResultsMap = new Map(
      notSupported.map((query) => [
        query,
        {
          domainName: query,
          price: null,
          available: DomainAvailability.UNAVAILABLE,
          isPremium: false,
          supported: false,
        },
      ]),
    );

    const supportedResults = await pMap(supported, async (query) => {
      try {
        return await this.searchForDomain(query);
      } catch (error) {
        this.logger.warn(
          {
            error,
            query,
            isExistingDomain: existingDomains.has(query),
          },
          'bulkSearch query failed, returning unavailable fallback',
        );
        return {
          domainName: query,
          price: null,
          available: DomainAvailability.UNAVAILABLE,
          isPremium: false,
          supported: existingDomains.has(query),
        };
      }
    });
    const supportedResultsMap = new Map(
      supportedResults.map((result) => [result.domainName, result]),
    );
    return queries.map(
      (query) =>
        notSupportedResultsMap.get(query) ??
        supportedResultsMap.get(query) ?? {
          domainName: query,
          price: null,
          available: DomainAvailability.UNAVAILABLE,
          isPremium: false,
          supported: true,
        },
    );
  }

  async getSuggestions(
    query: PunycodeDomainName,
    suggestionsCount: number,
  ): Promise<DomainSuggestionsQueryResult<Registrars>> {
    assertPunycodeDomainName(query);
    const [suggestions] = await Promise.all([
      this._getDomainSuggestionsWithPrices({
        domainName: query,
        suggestionsCount,
      }),
    ]);
    return {
      result: suggestions.map((suggestion) => ({
        domainName: suggestion.domainName,
        price: fromR53DomainPrice(suggestion.price),
        available: suggestion.availability,
        registrarKey: Registrars.Route53,
      })),
    };
  }

  async updateDomainContacts(
    domainName: PunycodeDomainName,
    contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const command = new UpdateDomainContactCommand({
      DomainName: domainName, // required
      RegistrantContact: contacts.registrantContact
        ? toR53Contact(contacts.registrantContact)
        : undefined,
      AdminContact: contacts.adminContact
        ? toR53Contact(contacts.adminContact)
        : undefined,
      TechContact: contacts.technicalContact
        ? toR53Contact(contacts.technicalContact)
        : undefined,
      BillingContact: contacts.billingContact
        ? toR53Contact(contacts.billingContact)
        : undefined,
    });
    const response = await this.send(command);

    return {
      type: OperationType.UPDATE_DOMAIN_CONTACT,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async getDomainContacts(
    domainName: PunycodeDomainName,
  ): Promise<DomainContacts> {
    assertPunycodeDomainName(domainName);

    const response = await this.getDomainDetails(domainName);
    return response.contacts;
  }

  async setNameServers(
    domainName: PunycodeDomainName,
    nameservers: Nameserver[],
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.send(
      new UpdateDomainNameserversCommand({
        DomainName: domainName,
        Nameservers: nameservers.map((Name) => ({ Name })),
      }),
    );

    return {
      type: OperationType.UPDATE_NAMESERVER,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async getNameServers(domainName: PunycodeDomainName): Promise<Nameservers> {
    assertPunycodeDomainName(domainName);

    const response = await this.getDomainDetails(domainName);
    assertNotNil(response.nameservers, 'Nameservers are not available');
    return response.nameservers;
  }

  async getOperationStatus(
    domainName: PunycodeDomainName,
    operationId: string,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    //todo!! use detailed status
    const response = await this.send(
      new GetOperationDetailCommand({
        OperationId: operationId,
      }),
    );

    return {
      operationId: response.OperationId,
      status: response.Status as any,
      type:
        response.Type === 'DOMAIN_LOCK'
          ? OperationType.DOMAIN_CHANGE_LOCK
          : (response.Type as any),
      message: response.Message,
      response,
    };
  }

  async setRenewOption(
    domainName: PunycodeDomainName,
    option: RenewOption,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const input = {
      DomainName: domainName,
    };
    const command =
      option === RenewOption.AUTOMATIC
        ? new EnableDomainAutoRenewCommand(input)
        : new DisableDomainAutoRenewCommand(input);
    const response = await this.send(command);

    return {
      response,
      type:
        option === RenewOption.AUTOMATIC
          ? OperationType.ENABLE_AUTORENEW
          : OperationType.DISABLE_AUTORENEW,
      status: OperationStatus.SUCCESSFUL,
      operationId: '',
    };
  }

  async getRenewOption(domainName: PunycodeDomainName): Promise<RenewOption> {
    assertPunycodeDomainName(domainName);

    const response = await this.getDomainDetails(domainName);
    return response.autoRenewOption;
  }

  async updateDomainContactsPrivacy(
    domainName: PunycodeDomainName,
    privacy: ContactsMap<DomainContactPrivacyEnum>,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const command = new UpdateDomainContactPrivacyCommand({
      DomainName: domainName, // required
      AdminPrivacy:
        privacy.adminContact === DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
      RegistrantPrivacy:
        privacy.registrantContact ===
        DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
      TechPrivacy:
        privacy.technicalContact ===
        DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA,
    });
    const response = await this.send(command);

    return {
      response,
      operationId: response.OperationId,
      type: OperationType.CHANGE_PRIVACY_PROTECTION,
      status: OperationStatus.IN_PROGRESS,
    };
  }

  async listAllDomains(): Promise<DomainSummary[]> {
    const domains: ListDomainsCommandOutput['Domains'] = [];

    let marker: string | undefined;

    do {
      const input: ListDomainsCommandInput = {
        SortCondition: {
          Name: 'Expiry', // required
          SortOrder: 'DESC', // required
        },
        Marker: marker,
        MaxItems: 100,
      };
      const command = new ListDomainsCommand(input);
      const response = await this.send(command);
      marker = response.NextPageMarker;
      domains.push(...(response.Domains ?? []));
    } while (marker);

    return domains.map(
      ({ DomainName, Expiry, AutoRenew, TransferLock }, index) => {
        assertNotNil(
          DomainName,
          `Domain name is not available for domain at index ${index}`,
        );
        assertNotNil(
          Expiry,
          `Expiration time is not available for domain ${DomainName}`,
        );
        assertNotNil(
          AutoRenew,
          `Auto renew option is not available for domain ${DomainName}`,
        );
        assertNotNil(
          TransferLock,
          `Transfer lock is not available for domain ${DomainName}`,
        );
        return {
          domainName: toPunycodeDomainName(DomainName),
          expirationTime: new Date(Expiry),
          autoRenewOption: AutoRenew
            ? RenewOption.AUTOMATIC
            : RenewOption.MANUAL,
          transferLocked: TransferLock,
        };
      },
    );
  }

  async listExpiredDomains(): Promise<
    {
      domainName: PunycodeDomainName;
    }[]
  > {
    const expiredOperations: ListOperationsCommandOutput['Operations'] = [];
    let marker: string | undefined;
    let pageCount = 0;
    const maxPages = 1000;

    // Get all EXPIRE_DOMAIN operations to find expired domains
    do {
      if (pageCount >= maxPages) {
        this.logger.warn('Reached maximum page limit for expired domains');
        break;
      }
      try {
        const input: ListOperationsCommandInput = {
          SortBy: 'SubmittedDate',
          SortOrder: 'DESC',
          Marker: marker,
          MaxItems: 100,
          Type: ['EXPIRE_DOMAIN'],
        };
        const command = new ListOperationsCommand(input);
        const response = await this.send(command);
        marker = response.NextPageMarker;
        expiredOperations.push(...(response.Operations ?? []));
        pageCount++;
      } catch (e) {
        this.logger.error(
          { error: e },
          'Failed to fetch expired domain operations',
        );
        throw e;
      }
    } while (marker);

    // Extract domain names from the operations and get their details
    const uniqueDomainNames = new Set<string>();
    expiredOperations.forEach((operation) => {
      if (operation.DomainName) {
        uniqueDomainNames.add(operation.DomainName);
      }
    });

    // Get domain details for each expired domain
    // Convert domain names to punycode format
    const expiredDomains: {
      domainName: PunycodeDomainName;
      expirationTime?: Date;
    }[] = Array.from(uniqueDomainNames).map((domainName) => ({
      domainName: toPunycodeDomainName(domainName),
      // Note: expirationTime could be populated by fetching domain details
      // or extracting from operation metadata if available
    }));

    this.logger.debug(
      {
        totalOperations: expiredOperations.length,
        uniqueDomains: uniqueDomainNames.size,
        retrievedDomains: expiredDomains.length,
      },
      'Retrieved expired domains using EXPIRE_DOMAIN operations',
    );

    return expiredDomains;
  }

  isOperationDone(status: OperationStatus) {
    return status === 'SUCCESSFUL' || status === 'FAILED' || status === 'ERROR';
  }

  private async _updatePrices() {
    try {
      let marker: string | undefined;
      const prices: ListPricesCommandOutput['Prices'] = [];
      do {
        const input: ListPricesCommandInput = {
          MaxItems: 1000,
          Marker: marker,
        };
        const command = new ListPricesCommand(input);
        const response = await this.send(command);
        marker = response.NextPageMarker;
        prices.push(...(response.Prices ?? []));
      } while (marker);
      const priceMap = indexBy((p) => p.Name, prices);
      this.cache.set('tld_prices', priceMap);
      return priceMap;
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  private async _getAllTldsPricing() {
    if (Object.keys(this.priceMap ?? {}).length === 0) {
      await this._updatePrices();
    }
    return this.priceMap;
  }

  async _getTldDomainsPricingFromDomainName({
    domainName,
  }: {
    domainName: PunycodeDomainName;
  }): Promise<DomainPrice> {
    const tld = getTldFromDomainName(domainName);
    if (isNil(tld)) {
      throw new Error(`could not determine price for ${domainName}`);
    }

    if (this.priceMap[tld]) {
      return this.priceMap[tld];
    }
    const res = (await this.send(new ListPricesCommand({ Tld: tld })))
      ?.Prices?.[0];
    if (!res) {
      throw new Error(
        `could not determine price for ${domainName} with tld ${tld}`,
      );
    }
    return res;
  }

  async _getDomainSuggestionsWithPrices(input: {
    domainName: PunycodeDomainName;
    suggestionsCount?: number;
    onlyAvailable?: boolean;
  }): Promise<GetDomainSuggestionsWithPricesOutput> {
    if (!input.suggestionsCount || input.suggestionsCount <= 0) {
      return [];
    }
    const command = new GetDomainSuggestionsCommand({
      DomainName: punycode.toASCII(input.domainName), // required
      SuggestionCount: input.suggestionsCount || 20, // required
      OnlyAvailable: input.onlyAvailable ?? true, // required
    });
    const suggestions = await this.send(command);

    const finalOutput: GetDomainSuggestionsWithPricesOutput = [];
    for (const { DomainName, Availability } of suggestions?.SuggestionsList ??
      []) {
      if (!DomainName) {
        continue;
      }
      const [_, tld] = DomainName.split('.');

      if (!this.priceMap[tld]) {
        const res = (await this.send(new ListPricesCommand({ Tld: tld })))
          ?.Prices?.[0];
        if (res) {
          this.priceMap[tld] = res;
        }
      }
      const price = this.priceMap[tld];

      finalOutput.push({
        domainName: toPunycodeDomainName(DomainName),
        availability: (Availability as any) || 'UNAVAILABLE',
        price,
      });
    }

    return finalOutput;
  }

  async queryPendingTransfer(
    _domainName: PunycodeDomainName,
  ): Promise<PendingTransferInfo | null> {
    // Route53 does not support querying pending transfers via API
    return null;
  }

  async approveTransfer(
    _domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult> {
    throw new Error('Route53 does not support transfer approval via API');
  }

  async rejectTransfer(
    _domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult> {
    throw new Error('Route53 does not support transfer rejection via API');
  }
}

type TldPrices = DomainPrice;
export type GetDomainSuggestionsWithPricesOutput = {
  domainName: PunycodeDomainName;
  availability: DomainAvailability;
  price: TldPrices;
}[];
