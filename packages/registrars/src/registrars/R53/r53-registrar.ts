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
  ListPricesCommand,
  RegisterDomainCommand,
  RenewDomainCommand,
  RetrieveDomainAuthCodeCommand,
  Route53DomainsClient,
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
  DomainPriceDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  DomainsQueryResult,
  LongRunningOperationResult,
  Nameserver,
  Nameservers,
  PriceWithCurrency,
  RdapDomainStatus,
  RegisterDomainInput,
  RenewDomainInput,
  TransferDomainInput,
  VerifyTransferInAuthCodeOutput,
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
import { R53Transformers } from './transformers';

import type {
  DomainPrice,
  ListDomainsCommandInput,
  ListDomainsCommandOutput,
  ListPricesCommandOutput,
  RegisterDomainCommandInput,
  RegisterDomainCommandOutput,
  RenewDomainCommandOutput,
  TransferDomainCommandInput,
} from '@aws-sdk/client-route-53-domains';
import { isNil } from 'ramda';
import type { PunycodeDomainName } from '#lib/data/validations';
import { assertPunycodeDomainName } from '#lib/data/validations';
export class R53RegistrarService extends AbstractRegistrarService<Registrars> {
  key = Registrars.Route53;
  nameservers = [1, 2, 3, 4].map((i) => `ns${i}.namefi.io`);
  client: Route53DomainsClient;

  readonly logger: pino.Logger;

  priceMap: Record<
    any,
    NonNullable<ListPricesCommandOutput['Prices']>[number]
  > = {};

  constructor({
    region,
    accessKeyId,
    secretAccessKey,
    customLogger,
  }: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    customLogger?: pino.Logger;
  }) {
    super();
    this.logger = customLogger ?? pino({ name: R53RegistrarService.name });
    this.logger.info('R53RegistrarService constructor');

    this.client = new Route53DomainsClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  async registerDomain(
    args: RegisterDomainInput,
  ): Promise<LongRunningOperationResult<RegisterDomainCommandOutput>> {
    //todo validate price
    const { domainName, durationInYears, renewOption } = args;
    assertPunycodeDomainName(domainName);

    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    const contacts = R53Transformers.ContactsMapTransformer.to(args.contacts);
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

    const response = await this.client.send(command);

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
    const response = await this.client.send(command);
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

    const { domainName, nameservers, authCode } = args;
    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    const contacts = R53Transformers.ContactsMapTransformer.to(args.contacts);
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
      Nameservers: this.nameservers.map((Name) => ({ Name })),
    };
    const response = await this.client.send(new TransferDomainCommand(input));

    return {
      type: OperationType.TRANSFER_IN_DOMAIN,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async retrieveAuthCode(domainName: PunycodeDomainName): Promise<string> {
    assertPunycodeDomainName(domainName);

    const res = await this.client.send(
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
  ): Promise<VerifyTransferInAuthCodeOutput> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.send(
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

    const response = await this.client.send(
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

    const response = await this.client.send(
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

    const response = await this.client.send(
      new GetDomainDetailCommand({
        DomainName: domainName,
      }),
    );

    return {
      ...R53Transformers.DomainInfoTransformer.from(response),
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
    const response = await this.client.send(command);
    assertNotNil(response.StatusList, 'Status list is not available');
    return response.StatusList;
  }

  async getTldPrices(options = { useCachedValue: true }) {
    const response = await this._getAllTldsPricing();
    return Object.fromEntries(
      Object.entries(response).map(([key, value]) => [
        key,
        R53Transformers.DomainPriceDetailsTransformer.from(value),
      ]),
    );
  }

  async getDomainPrice(
    domainName: PunycodeDomainName,
    operation: DomainOwnershipOperation,
  ): Promise<PriceWithCurrency> {
    assertPunycodeDomainName(domainName);
    const prices = await this.getDomainPriceDetails(domainName);

    switch (operation) {
      case DomainOwnershipOperation.REGISTER:
        return prices.registrationPrice;
      case DomainOwnershipOperation.CHANGE_OWNERSHIP:
        return prices.changeOwnershipPrice;
      case DomainOwnershipOperation.RENEW:
        return prices.renewalPrice;
      case DomainOwnershipOperation.RESTORE:
        return prices.restorationPrice;
      case DomainOwnershipOperation.TRANSFER:
        return prices.transferPrice;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  async getDomainPriceDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainPriceDetails> {
    assertPunycodeDomainName(domainName);

    const response = await this._getTldDomainsPricingFromDomainName({
      domainName,
    });
    return R53Transformers.DomainPriceDetailsTransformer.from(response);
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
    const response = await this.client.send(command);

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
    const response = await this.client.send(
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

  async searchForDomain(
    query: string,
  ): Promise<DomainsQueryResult<Registrars>> {
    assertPunycodeDomainName(query);

    const [searchResults, price] = await Promise.all([
      this.client.send(
        new CheckDomainAvailabilityCommand({
          DomainName: punycode.toASCII(query), // required
        }),
      ),
      this._getTldDomainsPricingFromDomainName({
        domainName: query,
      }),
    ]);
    return {
      result: {
        domainName: query,
        price: R53Transformers.DomainPriceDetailsTransformer.from(price),
        available:
          searchResults.Availability === 'AVAILABLE'
            ? DomainAvailability.AVAILABLE
            : DomainAvailability.UNAVAILABLE,
      },
      suggestions: [],
    };
  }

  async getSuggestions(
    query: string,
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
        price: R53Transformers.DomainPriceDetailsTransformer.from(
          suggestion.price,
        ),
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
      ...R53Transformers.ContactsMapTransformer.to(contacts),
    });
    const response = await this.client.send(command);

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

    const response = await this.client.send(
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
    const response = await this.client.send(
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
    const response = await this.client.send(command);

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
    const response = await this.client.send(command);

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
      const response = await this.client.send(command);
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

  isOperationDone(status: OperationStatus) {
    return status === 'SUCCESSFUL' || status === 'FAILED' || status === 'ERROR';
  }

  private async _updatePrices() {
    try {
      const res = await this.client.send(
        new ListPricesCommand({ MaxItems: 1000 }),
      );
      res.Prices?.forEach((prices) => {
        if (prices.Name) {
          this.priceMap[prices.Name] = prices;
        }
      });
      return this.priceMap;
    } catch (e) {
      this.logger.error(e);
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
  }: { domainName: PunycodeDomainName }): Promise<DomainPrice> {
    const levels = domainName.split('.'); // use tldts
    const tld = levels.pop();
    if (isNil(tld)) {
      this.logger.error(`could not determine price for ${domainName}`);
      throw new Error(`could not determine price for ${domainName}`);
    }
    if (!this.priceMap[tld]) {
      const res = (await this.client.send(new ListPricesCommand({ Tld: tld })))
        ?.Prices?.[0];
      if (res) {
        this.priceMap[tld] = res;
      }
    }
    return this.priceMap[tld];
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
    const suggestions = await this.client.send(command);

    const finalOutput: GetDomainSuggestionsWithPricesOutput = [];
    for (const { DomainName, Availability } of suggestions?.SuggestionsList ??
      []) {
      if (!DomainName) {
        continue;
      }
      const [_, tld] = DomainName.split('.');

      if (!this.priceMap[tld]) {
        const res = (
          await this.client.send(new ListPricesCommand({ Tld: tld }))
        )?.Prices?.[0];
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
}
type TldPrices = DomainPrice;
export type GetDomainSuggestionsWithPricesOutput = {
  domainName: PunycodeDomainName;
  availability: DomainAvailability;
  price: TldPrices;
}[];
