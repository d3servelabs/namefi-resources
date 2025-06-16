import { assertNotNil, resolve } from '@namefi-astra/utils';
import pino from 'pino';
import {
  assoc,
  flatten,
  isNil,
  isNotNil,
  pluck,
  prop,
  uniqBy,
  zipObj,
} from 'ramda';
import type {
  ContactsMap,
  DomainContactPrivacyEnum,
  DomainContacts,
  DomainOwnershipOperation,
  DomainPriceDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  DomainsQueryResult,
  Nameservers,
  PriceWithCurrency,
  RdapDomainStatus,
  RenewOption,
} from '#lib/abstract-registrar';
import { DomainAvailability } from '#lib/abstract-registrar';
import type { DnssecKey } from '#lib/abstract-registrar/data/dnssec';
import type {
  RegisterDomainInput,
  RenewDomainInput,
  TransferDomainInput,
  LongRunningOperationResult as iLongRunningOperationResult,
} from '#lib/abstract-registrar/registrar-service';
import { AbstractRegistrarService } from '#lib/abstract-registrar/registrar-service';
import {
  type PunycodeDomainName,
  assertPunycodeDomainName,
} from '#lib/data/validations';
import { supportsDnssec } from '#lib/supports-dnssec';
import { R53RegistrarService } from './R53/r53-registrar';
import { DynadotRegistrarService } from './dynadot/dynadot-registrar';
import { Registrars } from './registrars-keys';

export type WithRegistrar<T> = T & {
  registrarKey: Registrars;
};
type LongRunningOperationResult<T> = WithRegistrar<
  iLongRunningOperationResult<T>
>;

const injectRegistrar = assoc('registrarKey');

export class RegistrarService extends AbstractRegistrarService {
  key = 'main';
  logger = pino({ name: RegistrarService.name });
  private readonly domainToRegistrar: Map<PunycodeDomainName, Registrars> =
    new Map();
  private readonly r53Registrar: R53RegistrarService;
  private readonly dynadot: DynadotRegistrarService;
  private readonly config: {
    USE_MOCK_REGISTRARS: boolean;
  };

  constructor(
    r53Registrar: R53RegistrarService,
    dynadot: DynadotRegistrarService,
    {
      config,
    }: {
      config: {
        USE_MOCK_REGISTRARS: boolean;
      };
    },
  ) {
    super();
    this.r53Registrar = r53Registrar;
    this.dynadot = dynadot;
    this.config = config;
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
  ): Promise<DomainRegistration> {
    const provider = await this.getRegistrar(domainName);
    const details = await provider.getDomainDetails(domainName);
    return {
      ...details,
      supportsDnssec: supportsDnssec(domainName),
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
  ): Promise<PriceWithCurrency> {
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
    options?: { overrideRegistrar?: Registrars },
  ): Promise<WithRegistrar<DomainsQueryResult<Registrars>>> {
    assertPunycodeDomainName(query);
    const override =
      options?.overrideRegistrar ?? this.getOverriddenRegistrar();

    const registrars = isNil(override)
      ? this.getAllowedRegistrars()
      : [override];
    const registrarsList = registrars.map((r) => this._getRegistrar(r));

    const responsesList = await Promise.allSettled(
      registrarsList.map((r) => r.searchForDomain(query)),
    );

    const responsesByRegistrar = Object.fromEntries(
      Object.entries(zipObj(registrars, responsesList))
        .filter(([_, res]) => res.status === 'fulfilled')
        .map(([key, res]) => [
          key,
          res.status === 'fulfilled' ? res.value : null,
        ]) as [Registrars, DomainsQueryResult<Registrars>][],
    );

    const isAvailableOnAnyRegistrar = Object.values(responsesByRegistrar).some(
      (res) => res?.result?.available === DomainAvailability.AVAILABLE,
    );
    const priceType = isAvailableOnAnyRegistrar
      ? 'registrationPrice'
      : 'transferPrice';

    const pricesByRegistrar: Record<Registrars, PriceWithCurrency> =
      Object.fromEntries(
        (
          Object.entries(responsesByRegistrar).filter(([_, value]) => {
            const hasPrice =
              value?.result.price[priceType].price &&
              value.result.price[priceType].price > 0;
            const available =
              value?.result.available === DomainAvailability.AVAILABLE;
            const availableForOperation =
              isAvailableOnAnyRegistrar === available; // availableWhenRegistration And notAvailableWhenTransfer
            return hasPrice && availableForOperation;
          }) as [Registrars, DomainsQueryResult<Registrars>][]
        ).map(([key, value]) => [key, value.result.price[priceType]]),
      );

    const { registrar } = Object.entries(pricesByRegistrar).reduce(
      (prev, [registrar, price]) => {
        if (price.price < prev.bestPrice) {
          return { bestPrice: price.price, registrar };
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
      result: res.result,
      registrarKey: registrar,
      suggestions: uniqBy(
        prop('domainName'),
        flatten(pluck('suggestions', Object.values(responsesByRegistrar))),
      ),
    };
  }

  getAllowedRegistrars(): Registrars[] {
    if (this.config.USE_MOCK_REGISTRARS) {
      return [Registrars.NamefiMock];
    }
    return [Registrars.Route53, Registrars.Dynadot];
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
  ): Promise<LongRunningOperationResult<any>> {
    const registrar = await this.getRegistrar(domainNameLdh);
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
  ): Promise<DomainPriceDetails> {
    const registrar = await this.determineRegistrar(
      domainName,
      options?.registrar,
    );
    switch (registrar) {
      case Registrars.Route53:
        return this.r53Registrar.getDomainPriceDetails(domainName);
      case Registrars.Dynadot:
        return this.dynadot.getDomainPriceDetails(domainName);
      default:
        throw new Error('getDomainPriceDetails: unknown-registrar');
    }
  }

  async listAllDomains(options?: { registrar?: Registrars }): Promise<
    WithRegistrar<DomainSummary>[]
  > {
    const registrars = options?.registrar
      ? [options.registrar]
      : this.getAllowedRegistrars();

    const domainsLists = await Promise.all(
      registrars.map((registrar) =>
        this._getRegistrar(registrar).listAllDomains(),
      ),
    );
    const domains = domainsLists.flatMap((list, index) =>
      list.map(injectRegistrar(registrars[index])),
    );
    domains.forEach((domain) => {
      this.domainToRegistrar.set(domain.domainName, domain.registrarKey);
    });
    return domains;
  }

  private _getRegistrar(
    registrar: Registrars,
  ): AbstractRegistrarService<Registrars> {
    const allowedRegistrars = this.getAllowedRegistrars();
    if (!allowedRegistrars.includes(registrar)) {
      throw new Error(`registrar ${registrar} is not allowed`);
    }
    switch (registrar) {
      case Registrars.Route53:
        return this.r53Registrar;
      case Registrars.Dynadot:
        return this.dynadot;
      default:
        throw new Error('unknown-provider');
    }
  }

  private getOverriddenRegistrar(): Registrars | null {
    return null;
  }

  // biome-ignore lint/suspicious/useAwait: <explanation>
  async getRegistrarFromDomainName(
    domain: PunycodeDomainName,
  ): Promise<Registrars> {
    throw new Error('getRegistrarFromDomainName: unknown-registrar');
  }

  private async getRegistrar(
    domain: PunycodeDomainName,
  ): Promise<AbstractRegistrarService<Registrars>> {
    return this._getRegistrar(await this.determineRegistrar(domain));
  }

  private async determineRegistrar(
    domainName: PunycodeDomainName,
    registrar?: Registrars | null,
  ) {
    if (registrar) {
      return registrar;
    }
    const cachedRegistrar = this.domainToRegistrar.get(domainName);
    if (cachedRegistrar) {
      return cachedRegistrar;
    }

    const _registrar = await resolve(
      this.getRegistrarFromDomainName(domainName),
    );

    if (_registrar.result) {
      return _registrar.result;
    }

    const domainDetailsList = await Promise.allSettled(
      this.getAllowedRegistrars().map(async (registrarKey) => {
        const registrar = this._getRegistrar(registrarKey);
        const domainDetails = await registrar.getDomainDetails(domainName);
        return {
          registrarKey,
          domainDetails,
        };
      }),
    );
    const domainDetails = domainDetailsList.find(
      (result) => result.status === 'fulfilled',
    );

    if (domainDetails) {
      this.domainToRegistrar.set(domainName, domainDetails.value.registrarKey);
      return domainDetails.value.registrarKey;
    }

    const registrarKey = (await this.searchForDomain(domainName)).registrarKey;
    this.domainToRegistrar.set(domainName, registrarKey);
    return registrarKey;
  }
}

export function createRegistrarService(config: {
  USE_MOCK_REGISTRARS?: boolean;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  DYNADOT_API_KEY: string;
  DYNADOT_PRIVATE_KEY?: string;
  DYNADOT_ACCOUNT_ID?: string;
  DYNADOT_BASE_URL?: string;
}): RegistrarService {
  const r53Registrar = new R53RegistrarService({
    region: config.AWS_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  });

  const dynadot = new DynadotRegistrarService({
    DYNADOT_API_KEY: config.DYNADOT_API_KEY,
    DYNADOT_PRIVATE_KEY: config.DYNADOT_PRIVATE_KEY,
    DYNADOT_ACCOUNT_ID: config.DYNADOT_ACCOUNT_ID,
    DYNADOT_BASE_URL: config.DYNADOT_BASE_URL,
  });

  return new RegistrarService(r53Registrar, dynadot, {
    config: {
      USE_MOCK_REGISTRARS: config.USE_MOCK_REGISTRARS ?? false,
    },
  });
}
