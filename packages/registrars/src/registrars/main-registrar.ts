import { assertNotNil, matchAny, resolve } from '@namefi-astra/utils';
import pino, { type BaseLogger } from 'pino';
import {
  assoc,
  flatten,
  isNil,
  isNotNil,
  map,
  pluck,
  prop,
  uniqBy,
  toPairs,
  zipObj,
  filter,
  pickBy,
} from 'ramda';
import type {
  ContactsMap,
  DomainContactPrivacyEnum,
  DomainContacts,
  DomainOwnershipOperation,
  DomainPricingDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  DomainQueryResult,
  Nameservers,
  PendingTransferInfo,
  PricingDetails,
  RdapDomainStatus,
  RenewOption,
} from '#lib/abstract-registrar';
import { DomainAvailability } from '#lib/abstract-registrar';
import type { DnssecKey } from '#lib/abstract-registrar/data/dnssec';
import type {
  RegisterDomainInput,
  RenewDomainInput,
  TransferDomainInput,
  ResubmitImportDomainRequestInput,
  CancelImportDomainRequestInput,
  LongRunningOperationResult as iLongRunningOperationResult,
} from '#lib/abstract-registrar/registrar-service';
import { AbstractRegistrarService } from '#lib/abstract-registrar/registrar-service';
import {
  type PunycodeDomainName,
  assertPunycodeDomainName,
  toPunycodeDomainName,
} from '#lib/data/validations';
import { computeChargesInUsdOrThrow } from '#lib/multi-year-pricing';
import { supportsDnssec } from '#lib/supports-dnssec';
import { R53RegistrarService } from './R53/r53-registrar';
import { DynadotRegistrarService } from './dynadot/dynadot-registrar';
import {
  CentralNicRegistrarService,
  type CentralNicConfig,
} from './centralnic';
import { Registrars } from './registrars-keys';
import pProps from 'p-props';
import Bottleneck from 'bottleneck';

export type WithRegistrar<T> = T & {
  registrarKey: Registrars;
};
type LongRunningOperationResult<T> = WithRegistrar<
  iLongRunningOperationResult<T>
>;
type RegistrarWithTldPricing = AbstractRegistrarService<Registrars> & {
  getTldPrices: () => Promise<Record<string, DomainPricingDetails>>;
};

const injectRegistrar = assoc('registrarKey');

export class RegistrarService extends AbstractRegistrarService {
  logger: BaseLogger;
  private readonly domainToRegistrar: Map<
    PunycodeDomainName,
    { registrarKey?: Registrars; found: boolean }
  > = new Map();
  private readonly registrars: Record<
    Registrars,
    AbstractRegistrarService<Registrars>
  >;

  constructor(
    registrars: Record<Registrars, AbstractRegistrarService<Registrars>>,
    private readonly getRegistrarKeyForExistingDomain?: (
      domain: PunycodeDomainName,
    ) => Promise<Registrars | null>,
    private readonly getRegistrarKeysFromExistingDomains?: (
      domains: PunycodeDomainName[],
    ) => Promise<Record<PunycodeDomainName, Registrars>>,
    config?: {
      customLogger?: BaseLogger;
    },
  ) {
    super('main');
    this.registrars = registrars;
    this.logger = config?.customLogger ?? pino({ name: RegistrarService.name });
  }

  async getAllowedParentDomains(): Promise<PunycodeDomainName[]> {
    const allowedParentDomains = await Promise.all(
      this.getAllowedRegistrars().map((registrar) =>
        this.registrars[registrar].getAllowedParentDomains(),
      ),
    );
    return Array.from(new Set(flatten(allowedParentDomains)));
  }

  registerDomain(
    args: WithRegistrar<RegisterDomainInput>,
  ): Promise<LongRunningOperationResult<any>> {
    return this._getRegistrar(args.registrarKey)
      .registerDomain(args)
      .then(injectRegistrar(args.registrarKey));
  }

  async renewDomain(
    args: RenewDomainInput,
  ): Promise<LongRunningOperationResult<any>> {
    const registrar = await this.getRegistrar(args.domainName);
    return registrar.renewDomain(args).then(injectRegistrar(registrar.key));
  }

  transferDomain(
    args: WithRegistrar<TransferDomainInput>,
  ): Promise<LongRunningOperationResult<any>> {
    return this._getRegistrar(args.registrarKey)
      .transferDomain(args)
      .then(injectRegistrar(args.registrarKey));
  }

  async resubmitImportDomainRequest(
    args: ResubmitImportDomainRequestInput,
    options?: { overrideRegistrar?: Registrars },
  ): Promise<LongRunningOperationResult<any>> {
    const provider = options?.overrideRegistrar
      ? this._getRegistrar(options.overrideRegistrar)
      : await this.getRegistrar(args.domainName);
    return provider
      .resubmitImportDomainRequest(args)
      .then(injectRegistrar(provider.key));
  }

  async cancelImportDomainRequest(
    args: CancelImportDomainRequestInput,
    options?: { overrideRegistrar?: Registrars },
  ): Promise<LongRunningOperationResult<any>> {
    const provider = options?.overrideRegistrar
      ? this._getRegistrar(options.overrideRegistrar)
      : await this.getRegistrar(args.domainName);
    return provider
      .cancelImportDomainRequest(args)
      .then(injectRegistrar(provider.key));
  }

  async retrieveAuthCode(domainName: PunycodeDomainName): Promise<string> {
    const provider = await this.getRegistrar(domainName);
    return provider.retrieveAuthCode(domainName);
  }

  async lockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider.lockDomain(domainName).then(injectRegistrar(provider.key));
  }

  async unlockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .unlockDomain(domainName)
      .then(injectRegistrar(provider.key));
  }

  async getDomainDetails(
    domainName: PunycodeDomainName,
  ): Promise<WithRegistrar<DomainRegistration>> {
    const provider = await this.getRegistrar(domainName);
    const details = await provider.getDomainDetails(domainName);
    return {
      ...details,
      supportsDnssec: supportsDnssec(domainName),
      registrarKey: provider.key,
    };
  }

  async getDomainStatus(
    domainName: PunycodeDomainName,
  ): Promise<RdapDomainStatus> {
    const provider = await this.getRegistrar(domainName);
    return provider.getDomainStatus(domainName);
  }

  async getDomainPrice(
    domainName: PunycodeDomainName,
    operation: DomainOwnershipOperation,
    options?: { registrar: Registrars },
  ): Promise<PricingDetails> {
    const registrar = isNotNil(options?.registrar)
      ? this._getRegistrar(options.registrar)
      : await this.getRegistrar(domainName); // todo for renew
    return registrar.getDomainPrice(domainName, operation);
  }

  async addDelegationSigner(
    domainName: PunycodeDomainName,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .addDelegationSigner(domainName, signingAttributes)
      .then(injectRegistrar(provider.key));
  }

  async removeDelegationSigner(
    domainName: PunycodeDomainName,
    publicKeyOrId: string,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .removeDelegationSigner(domainName, publicKeyOrId)
      .then(injectRegistrar(provider.key));
  }

  async updateDomainContacts(
    domainName: PunycodeDomainName,
    contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .updateDomainContacts(domainName, contacts)
      .then(injectRegistrar(provider.key));
  }

  async getDomainContacts(
    domainName: PunycodeDomainName,
  ): Promise<DomainContacts> {
    const provider = await this.getRegistrar(domainName);
    return provider.getDomainContacts(domainName);
  }

  async updateDomainContactsPrivacy(
    domainName: PunycodeDomainName,
    privacy: ContactsMap<DomainContactPrivacyEnum>,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .updateDomainContactsPrivacy(domainName, privacy)
      .then(injectRegistrar(provider.key));
  }

  async searchForDomain(
    query: PunycodeDomainName,
  ): Promise<WithRegistrar<DomainQueryResult>> {
    assertPunycodeDomainName(query);
    const registrars = this.getAllowedRegistrars();
    const registrarsList = registrars.map((r) => this.registrars[r]);

    const responsesList = await Promise.allSettled(
      registrarsList.map((r) => r.searchForDomain(query)),
    );

    const responsesByRegistrar = Object.fromEntries(
      Object.entries(zipObj(registrars, responsesList))
        .filter(([_, res]) => res.status === 'fulfilled')
        .map(([key, res]) => [
          key,
          res.status === 'fulfilled' ? res.value : null,
        ]) as [Registrars, DomainQueryResult][],
    );

    const isAvailableOnAnyRegistrar = Object.values(responsesByRegistrar).some(
      (res) => res?.available === DomainAvailability.AVAILABLE,
    );
    const priceType = isAvailableOnAnyRegistrar
      ? 'registrationPrice'
      : 'importPrice';

    const pricesByRegistrar: Record<Registrars, PricingDetails | null> =
      Object.fromEntries(
        (
          Object.entries(responsesByRegistrar).filter(([_, value]) => {
            try {
              const { price, available: availability } = value;
              const hasPrice =
                price?.[priceType] &&
                computeChargesInUsdOrThrow(price![priceType], 1) > 0;

              const available = availability === DomainAvailability.AVAILABLE;
              const availableForOperation =
                isAvailableOnAnyRegistrar === available; // availableWhenRegistration And notAvailableWhenTransfer
              return hasPrice && availableForOperation;
            } catch (error) {
              this.logger.error(error);
              return false;
            }
          }) as [Registrars, DomainQueryResult][]
        ).map(([key, value]) => [key, value.price?.[priceType] ?? null]),
      );

    const { registrar } = Object.entries(pricesByRegistrar).reduce(
      (prev, [registrar, price]) => {
        try {
          if (price) {
            const challengingPrice = computeChargesInUsdOrThrow(price, 1);
            if (challengingPrice === 0) {
              return prev;
            }
            if (
              challengingPrice === prev.bestPrice &&
              matchAny(
                registrar,
                Registrars.DynadotGdg,
                Registrars.DynadotRegular,
              ) &&
              matchAny(
                prev.registrar,
                Registrars.DynadotGdg,
                Registrars.DynadotRegular,
              )
            ) {
              // if the price is the same and the registrar is DynadotGdg or DynadotRegular, choose DynadotGdg
              return {
                bestPrice: challengingPrice,
                registrar: Registrars.DynadotGdg,
              };
            }
            if (challengingPrice < prev.bestPrice) {
              return {
                bestPrice: challengingPrice,
                registrar,
              };
            }
          }
        } catch (error) {
          this.logger.error(error);
        }
        return prev;
      },
      {
        bestPrice: Number.MAX_SAFE_INTEGER,
        registrar: null as Registrars | null,
      },
    );
    if (isNil(registrar)) {
      throw new Error('could-not-choose-registrar');
    }
    const res = responsesByRegistrar[registrar];
    assertNotNil(res, 'no response from registrar');
    return {
      ...res,
      registrarKey: registrar,
    };
  }

  async bulkSearch(
    queries: PunycodeDomainName[],
  ): Promise<WithRegistrar<DomainQueryResult>[]> {
    try {
      const fallbackRegistrar = this.getAllowedRegistrars()[0];
      const registrarKeys =
        (await this._getRegistrarKeysFromExistingDomains(queries)) ?? {};

      const promises = await pProps(this.registrars, async (registrar) => {
        try {
          if (registrar.key === Registrars.Route53) {
            const route53ExistingDomains = queries.filter(
              (domain) => registrarKeys[domain] === Registrars.Route53,
            );
            const route53Responses = await registrar.bulkSearch(
              route53ExistingDomains,
            );
            const route53ResponsesMap = new Map(
              route53Responses.map((response) => [
                response.domainName,
                response,
              ]),
            );
            const res = queries.map(
              (domain) =>
                route53ResponsesMap.get(domain) ?? {
                  domainName: domain,
                  price: null,
                  available: DomainAvailability.UNAVAILABLE,
                  isPremium: false,
                  supported: false,
                },
            );
            return res;
          }
          const res = await registrar.bulkSearch(queries);

          this.logger.debug(res, `Bulk search completed for ${registrar.key}`);
          return res;
        } catch (error) {
          this.logger.error(
            { error, registrar: registrar.key },
            'error in bulkSearch',
          );
        }
      });

      const responsesByRegistrar: Record<Registrars, DomainQueryResult[]> =
        pickBy(isNotNil, promises);

      return this._chooseBestRegistrar(
        responsesByRegistrar,
        queries,
        fallbackRegistrar,
      );
    } catch (error) {
      this.logger.error(error, 'error in bulkSearch');
      throw error;
    }
  }

  private _chooseBestRegistrar(
    responsesByRegistrar: Record<Registrars, DomainQueryResult[]>,
    queries: PunycodeDomainName[],
    fallbackRegistrar: Registrars,
  ) {
    const result = queries.map((query, index) => {
      // map the registrar to the result
      const registrarToResult = toPairs(map(prop(index), responsesByRegistrar));

      const isAvailableOnAnyRegistrar = registrarToResult.some(
        ([_, res]) => res?.available === DomainAvailability.AVAILABLE,
      );
      const isSupportedByAnyRegistrar = registrarToResult.some(
        ([_, res]) => res.supported,
      );

      const comparePrice = isAvailableOnAnyRegistrar
        ? 'registrationPrice'
        : 'importPrice';

      // filter out registrars that don't have a price or the price is not available
      const filteredRegistrarToResult = filter(([_, res]) => {
        if (isNil(res) || isNil(res.price) || isNil(res.price[comparePrice])) {
          return false;
        }
        return computeChargesInUsdOrThrow(res.price[comparePrice], 1) > 0;
      }, registrarToResult);

      // and map the registrar to the price
      const registrarToPrice = map(
        ([registrar, res]) => [
          registrar,
          computeChargesInUsdOrThrow(res.price![comparePrice], 1),
        ],
        filteredRegistrarToResult,
      ) as [Registrars, number][];

      // find the best price
      const bestPrice = registrarToPrice.reduce(
        (prev, [registrar, challengingPrice]) => {
          if (challengingPrice < prev.bestPrice) {
            return {
              bestPrice: challengingPrice,
              registrar,
            };
          }
          if (
            challengingPrice === prev.bestPrice &&
            [registrar, prev.registrar].includes(Registrars.DynadotGdg)
          ) {
            // if the price is the same then choose DynadotGdg
            return {
              bestPrice: challengingPrice,
              registrar: Registrars.DynadotGdg,
            };
          }

          return prev;
        },
        {
          bestPrice: Number.MAX_SAFE_INTEGER,
          registrar: null as Registrars | null,
        },
      );

      // find the result for the best price
      const chosenResult = registrarToResult.find(
        ([registrar]) => registrar === bestPrice.registrar,
      )?.[1];

      // if the best price is not found, return the fallback result
      if (isNil(bestPrice.registrar) || isNil(chosenResult)) {
        return {
          domainName: query,
          registrarKey: fallbackRegistrar,
          available: DomainAvailability.UNAVAILABLE,
          isPremium: false,
          price: null,
          supported: isSupportedByAnyRegistrar,
        };
      }

      return {
        ...chosenResult,
        registrarKey: bestPrice.registrar,
      };
    });
    return result;
  }

  async getRegistrarsTldPricing(): Promise<
    Record<Registrars, Record<string, DomainPricingDetails>>
  > {
    const entries = await Promise.all(
      this.getAllowedRegistrars().map(async (registrarKey) => {
        const registrar = this.registrars[registrarKey];
        if (!this.supportsTldPricing(registrar)) {
          return null;
        }
        try {
          const priceMap = await registrar.getTldPrices();
          const parentDomains = await registrar.getAllowedParentDomains();
          const finalPriceMap = Object.fromEntries(
            parentDomains
              .map((parent) => [parent, priceMap[parent]])
              .filter(([_p, price]) => price !== null),
          );

          return [registrarKey, finalPriceMap] as const;
        } catch (error) {
          this.logger.error(
            { error, registrar: registrarKey },
            'error fetching TLD pricing',
          );
          return null;
        }
      }),
    );

    const filteredEntries = entries.filter(
      (entry): entry is [Registrars, Record<string, DomainPricingDetails>] =>
        entry !== null,
    );

    return Object.fromEntries(filteredEntries);
  }

  getAllowedRegistrars(): Registrars[] {
    return Object.keys(this.registrars) as Registrars[];
  }

  async getSuggestions(
    query: string,
    suggestionCount: number,
  ): Promise<DomainSuggestionsQueryResult<Registrars>> {
    this.logger.debug(
      `[MethodCall] getSuggestions(query: ${query}, suggestionCount: ${suggestionCount})`,
    );
    const responses = await Promise.all(
      this.getAllowedRegistrars().map(
        async (registrar) =>
          [
            registrar,
            await this._getRegistrar(registrar).getSuggestions(
              query,
              suggestionCount,
            ),
          ] as const,
      ),
    );

    const responsesByProvider = Object.fromEntries(responses);

    const output = {
      result: uniqBy(
        prop('domainName'),
        flatten(pluck('result', Object.values(responsesByProvider))),
      ),
    };
    this.logger.debug(
      `[Response] getSuggestions(query: ${query}, suggestionCount: ${suggestionCount}) => `,
      output,
    );
    return output;
  }

  async setNameServers(
    domainName: PunycodeDomainName,
    nameservers: Nameservers,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .setNameServers(domainName, nameservers)
      .then(injectRegistrar(provider.key));
  }

  async getNameServers(domainName: PunycodeDomainName): Promise<Nameservers> {
    const provider = await this.getRegistrar(domainName);
    return provider.getNameServers(domainName);
  }

  async getOperationStatus(
    domainNameLdh: PunycodeDomainName,
    operationId: string,
    options?: { overrideRegistrar?: Registrars },
  ): Promise<LongRunningOperationResult<any>> {
    const registrar = isNotNil(options?.overrideRegistrar)
      ? this._getRegistrar(options.overrideRegistrar)
      : await this.getRegistrar(domainNameLdh);

    return registrar
      .getOperationStatus(domainNameLdh, operationId)
      .then(injectRegistrar(registrar.key));
  }

  async setRenewOption(
    domainName: PunycodeDomainName,
    option: RenewOption,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .setRenewOption(domainName, option)
      .then(injectRegistrar(provider.key));
  }

  async getRenewOption(domainName: PunycodeDomainName): Promise<RenewOption> {
    const provider = await this.getRegistrar(domainName);
    return provider.getRenewOption(domainName);
  }

  async getDomainPriceDetails(
    domainName: PunycodeDomainName,
    options?: { registrar?: Registrars },
  ): Promise<DomainPricingDetails> {
    const registrarKey = await this.determineRegistrar(
      domainName,
      options?.registrar,
    );

    return this.registrars[registrarKey].getDomainPriceDetails(domainName);
  }

  async listAllDomains(options?: {
    registrar?: Registrars;
  }): Promise<WithRegistrar<DomainSummary>[]> {
    const registrars = options?.registrar
      ? [options.registrar]
      : this.getAllowedRegistrars();

    const domainsLists = await Promise.all(
      registrars.map((registrar) =>
        this.registrars[registrar].listAllDomains(),
      ),
    );
    const domains = domainsLists.flatMap((list, index) =>
      list.map(injectRegistrar(registrars[index])),
    );
    domains.forEach((domain) => {
      this.domainToRegistrar.set(domain.domainName, {
        found: true,
        registrarKey: domain.registrarKey,
      });
    });
    return domains;
  }

  async listExpiredDomains(options?: { registrar?: Registrars }): Promise<
    WithRegistrar<{
      domainName: PunycodeDomainName;
    }>[]
  > {
    const registrars = options?.registrar
      ? [options.registrar]
      : this.getAllowedRegistrars();

    const expiredDomainsLists = await Promise.all(
      registrars.map((registrar) =>
        this.registrars[registrar].listExpiredDomains(),
      ),
    );
    const expiredDomains = expiredDomainsLists.flatMap((list, index) =>
      list.map(injectRegistrar(registrars[index])),
    );

    // Cache the domain-to-registrar mapping for expired domains too
    expiredDomains.forEach((domain) => {
      this.domainToRegistrar.set(domain.domainName, {
        found: true,
        registrarKey: domain.registrarKey,
      });
    });

    return expiredDomains;
  }

  private _getRegistrar(
    registrar: Registrars,
  ): AbstractRegistrarService<Registrars> {
    const allowedRegistrars = this.getAllowedRegistrars();
    if (!allowedRegistrars.includes(registrar)) {
      throw new Error(`registrar ${registrar} is not allowed`);
    }
    return this.registrars[registrar];
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getRegistrarFromDomainName(
    domain: PunycodeDomainName,
  ): Promise<Registrars> {
    // if the domain is already indexed, use the registrar key from the database
    const registrarKey = await this.getRegistrarKeyForExistingDomain?.(domain);
    if (isNotNil(registrarKey)) {
      return registrarKey;
    }
    throw new Error('getRegistrarFromDomainName: unknown-registrar');
  }

  private async _getRegistrarKeysFromExistingDomains(
    domains: PunycodeDomainName[],
  ): Promise<Record<PunycodeDomainName, Registrars>> {
    const domainsNotCached = await domains.filter(
      (domain) => !this.domainToRegistrar.has(domain),
    );
    if (domainsNotCached.length > 0) {
      let registrarKeys: Record<PunycodeDomainName, Registrars> = {};
      if (isNotNil(this.getRegistrarKeysFromExistingDomains)) {
        registrarKeys =
          await this.getRegistrarKeysFromExistingDomains(domainsNotCached);
      } else {
        registrarKeys = Object.fromEntries(
          await Promise.all(
            domains.map(async (domain) => {
              const registrarKey =
                await this.getRegistrarKeyForExistingDomain?.(domain);
              return [toPunycodeDomainName(domain), registrarKey] as [
                PunycodeDomainName,
                Registrars,
              ];
            }),
          ),
        );
      }
      domainsNotCached.forEach((domain) => {
        if (isNotNil(registrarKeys[domain])) {
          this.domainToRegistrar.set(domain, {
            found: true,
            registrarKey: registrarKeys[domain],
          });
        } else {
          this.domainToRegistrar.set(domain, { found: false });
        }
      });
    }
    return Object.fromEntries(
      domains.map((domain) => [
        domain,
        this.domainToRegistrar.get(domain)?.registrarKey,
      ]),
    ) as Record<PunycodeDomainName, Registrars>;
  }

  private async getRegistrar(
    domain: PunycodeDomainName,
  ): Promise<AbstractRegistrarService<Registrars>> {
    const registrarKey = await this.determineRegistrar(domain);
    this.logger.debug(
      `Getting registrar for domain ${domain}: ${registrarKey}`,
    );
    return this.registrars[registrarKey];
  }

  private async determineRegistrar(
    domainName: PunycodeDomainName,
    registrar?: Registrars | null,
  ) {
    if (registrar) {
      return registrar;
    }
    const cachedRegistrar = this.domainToRegistrar.get(domainName);
    if (cachedRegistrar?.found && isNotNil(cachedRegistrar.registrarKey)) {
      this.logger.trace(
        {
          cachedRegistrar,
          domainName,
        },
        `[Determine Registrar]: [${domainName}] cached registrar`,
      );
      return cachedRegistrar.registrarKey;
    }

    const _registrar = await resolve(
      this.getRegistrarFromDomainName(domainName),
    );
    this.logger.trace(
      {
        registrar: _registrar,
        domainName,
      },
      `[Determine Registrar]: [${domainName}] from index`,
    );
    if (_registrar.result) {
      return _registrar.result;
    }

    const allowedRegistrars = this.getAllowedRegistrars();
    const domainDetailsList = await Promise.all(
      allowedRegistrars.map(async (registrarKey) => {
        try {
          const registrar = this.registrars[registrarKey];
          const domainDetails = await registrar.getDomainDetails(domainName);
          return {
            registrarKey,
            domainDetails,
          };
        } catch (_e) {
          return {
            registrarKey,
          };
        }
      }),
    );
    this.logger.trace(
      {
        resultsSummary: domainDetailsList.map(
          ({ registrarKey, domainDetails }) => ({
            registrarKey,
            found: !!domainDetails,
          }),
        ),
      },
      `[Determine Registrar]: [${domainName}] from live registrars`,
    );
    const domainDetails = domainDetailsList.find((result) =>
      isNotNil(result.domainDetails),
    );

    if (domainDetails) {
      this.domainToRegistrar.set(domainName, {
        found: true,
        registrarKey: domainDetails.registrarKey,
      });
      return domainDetails.registrarKey;
    }

    const registrarKey = (await this.searchForDomain(domainName)).registrarKey;
    this.domainToRegistrar.set(domainName, {
      found: true,
      registrarKey: registrarKey,
    });
    return registrarKey;
  }

  async queryPendingTransfer(
    domainName: PunycodeDomainName,
  ): Promise<PendingTransferInfo | null> {
    const provider = await this.getRegistrar(domainName);
    return provider.queryPendingTransfer(domainName);
  }

  async approveTransfer(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .approveTransfer(domainName)
      .then(injectRegistrar(provider.key));
  }

  async rejectTransfer(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .rejectTransfer(domainName)
      .then(injectRegistrar(provider.key));
  }

  private supportsTldPricing(
    registrar: AbstractRegistrarService<Registrars>,
  ): registrar is RegistrarWithTldPricing {
    return (
      typeof (registrar as RegistrarWithTldPricing).getTldPrices === 'function'
    );
  }
}

export function createRegistrarService(config: {
  getRegistrarKeyForExistingDomain?: (
    domain: PunycodeDomainName,
  ) => Promise<Registrars | null>;
  getRegistrarKeysForExistingDomains?: (
    domains: PunycodeDomainName[],
  ) => Promise<Record<PunycodeDomainName, Registrars>>;
  redisClientOptions?: Bottleneck.IORedisConnectionOptions['clientOptions'] & {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
  };
  registrars: (
    connection?: Bottleneck.IORedisConnection,
  ) => Record<Registrars, AbstractRegistrarService<Registrars>>;
  customLogger?: BaseLogger;
}): RegistrarService {
  const connection = config.redisClientOptions
    ? new Bottleneck.IORedisConnection({
        clientOptions: config.redisClientOptions,
      })
    : undefined;

  return new RegistrarService(
    config.registrars(connection),
    config.getRegistrarKeyForExistingDomain,
    config.getRegistrarKeysForExistingDomains,
    { customLogger: config.customLogger },
  );
}
