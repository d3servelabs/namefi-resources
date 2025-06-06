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
import { config, secrets } from '#lib/env';
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

  async retrieveAuthCode(domainName: string): Promise<string> {
    const provider = await this.getRegistrar(domainName);
    return provider.retrieveAuthCode(domainName);
  }

  async lockDomain(
    domainName: string,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider.lockDomain(domainName).then(injectRegistrar(provider.key));
  }

  async unlockDomain(
    domainName: string,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .unlockDomain(domainName)
      .then(injectRegistrar(provider.key));
  }

  async getDomainDetails(domainName: string): Promise<DomainRegistration> {
    const provider = await this.getRegistrar(domainName);
    const details = await provider.getDomainDetails(domainName);
    return {
      ...details,
      supportsDnssec: supportsDnssec(domainName),
    };
  }

  async getDomainStatus(domainName: string): Promise<RdapDomainStatus> {
    const provider = await this.getRegistrar(domainName);
    return provider.getDomainStatus(domainName);
  }

  async getDomainPrice(
    domainName: string,
    operation: DomainOwnershipOperation,
    options?: { registrar: Registrars },
  ): Promise<PriceWithCurrency> {
    const registrar = isNotNil(options?.registrar)
      ? this._getRegistrar(options.registrar)
      : await this.getRegistrar(domainName); // todo for renew
    return registrar.getDomainPrice(domainName, operation);
  }

  async addDelegationSigner(
    domainName: string,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .addDelegationSigner(domainName, signingAttributes)
      .then(injectRegistrar(provider.key));
  }

  async removeDelegationSigner(
    domainName: string,
    publicKeyOrId: string,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .removeDelegationSigner(domainName, publicKeyOrId)
      .then(injectRegistrar(provider.key));
  }

  async updateDomainContacts(
    domainName: string,
    contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .updateDomainContacts(domainName, contacts)
      .then(injectRegistrar(provider.key));
  }

  async getDomainContacts(domainName: string): Promise<DomainContacts> {
    const provider = await this.getRegistrar(domainName);
    return provider.getDomainContacts(domainName);
  }

  async updateDomainContactsPrivacy(
    domainName: string,
    privacy: ContactsMap<DomainContactPrivacyEnum>,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .updateDomainContactsPrivacy(domainName, privacy)
      .then(injectRegistrar(provider.key));
  }

  async searchForDomain(
    query: string,
    options?: { overrideRegistrar?: Registrars },
  ): Promise<WithRegistrar<DomainsQueryResult<Registrars>>> {
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
    domainName: string,
    nameservers: Nameservers,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .setNameServers(domainName, nameservers)
      .then(injectRegistrar(provider.key));
  }

  async getNameServers(domainName: string): Promise<Nameservers> {
    const provider = await this.getRegistrar(domainName);
    return provider.getNameServers(domainName);
  }

  async getOperationStatus(
    domainNameLdh: string,
    operationId: string,
  ): Promise<LongRunningOperationResult<any>> {
    const registrar = this._getRegistrar(
      await this.getRegistrarFromDomainName(domainNameLdh),
    );
    return registrar
      .getOperationStatus(domainNameLdh, operationId)
      .then(injectRegistrar(registrar.key));
  }

  async setRenewOption(
    domainName: string,
    option: RenewOption,
  ): Promise<LongRunningOperationResult<any>> {
    const provider = await this.getRegistrar(domainName);
    return provider
      .setRenewOption(domainName, option)
      .then(injectRegistrar(provider.key));
  }

  async getRenewOption(domainName: string): Promise<RenewOption> {
    const provider = await this.getRegistrar(domainName);
    return provider.getRenewOption(domainName);
  }

  async getDomainPriceDetails(
    domainName: string,
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
    return domainsLists.flatMap((list, index) =>
      list.map(injectRegistrar(registrars[index])),
    );
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
  async getRegistrarFromDomainName(domain: string): Promise<Registrars> {
    throw new Error('getRegistrarFromDomainName: unknown-registrar');
  }

  private async getRegistrar(
    domain: string,
  ): Promise<AbstractRegistrarService<Registrars>> {
    return this._getRegistrar(await this.determineRegistrar(domain));
  }

  private async determineRegistrar(
    domainName: string,
    registrar?: Registrars | null,
  ) {
    if (registrar) {
      return registrar;
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
      return domainDetails.value.registrarKey;
    }

    return (await this.searchForDomain(domainName)).registrarKey;
  }
}

export function createRegistrarService(
  _config: {
    USE_MOCK_REGISTRARS?: boolean;
  } = {},
): RegistrarService {
  const r53Registrar = new R53RegistrarService({
    region: config.AWS_REGION,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  });

  const dynadot = new DynadotRegistrarService({
    DYNADOT_API_KEY: secrets.DYNADOT_API_KEY,
    DYNADOT_PRIVATE_KEY: secrets.DYNADOT_PRIVATE_KEY,
    DYNADOT_ACCOUNT_ID: secrets.DYNADOT_ACCOUNT_ID,
    DYNADOT_BASE_URL: config.DYNADOT_BASE_URL,
  });

  return new RegistrarService(r53Registrar, dynadot, {
    config: {
      USE_MOCK_REGISTRARS: _config.USE_MOCK_REGISTRARS ?? false,
    },
  });
}
