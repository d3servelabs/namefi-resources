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

export class R53RegistrarService extends AbstractRegistrarService<Registrars> {
  key = Registrars.Route53;
  nameservers = [1, 2, 3, 4].map((i) => `ns${i}.namefi.io`);
  client: Route53DomainsClient;

  logger = pino({
    name: 'R53RegistrarService',
  });

  priceMap: Record<
    any,
    NonNullable<ListPricesCommandOutput['Prices']>[number]
  > = {};

  constructor({
    region,
    accessKeyId,
    secretAccessKey,
  }: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    super();
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
    const command = new RenewDomainCommand({
      DomainName: punycode.toASCII(args.domainName),
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
    const { domainName, nameservers, authCode } = args;
    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    const contacts = R53Transformers.ContactsMapTransformer.to(args.contacts);
    const input: TransferDomainCommandInput = {
      IdnLangCode: IdnLanguageCodeISO639_2(domainName),
      DomainName: punycode.toASCII(domainName), // required
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

  async retrieveAuthCode(domainName: string): Promise<string> {
    const res = await this.client.send(
      new RetrieveDomainAuthCodeCommand({
        DomainName: punycode.toASCII(domainName),
      }),
    );
    assertNotNil(res.AuthCode, 'Auth code is not available');
    return res.AuthCode;
  }

  async verifyAuthCode(
    domainName: string,
    authCode: string,
  ): Promise<VerifyTransferInAuthCodeOutput> {
    const response = await this.client.send(
      new CheckDomainTransferabilityCommand({
        DomainName: punycode.toASCII(domainName),
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
    domainName: string,
  ): Promise<LongRunningOperationResult<any>> {
    const response = await this.client.send(
      new EnableDomainTransferLockCommand({
        DomainName: punycode.toASCII(domainName),
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
    domainName: string,
  ): Promise<LongRunningOperationResult<any>> {
    const response = await this.client.send(
      new DisableDomainTransferLockCommand({
        DomainName: punycode.toASCII(domainName),
      }),
    );

    return {
      type: OperationType.DOMAIN_CHANGE_LOCK,
      operationId: response.OperationId,
      status: OperationStatus.SUBMITTED,
      response,
    };
  }

  async getDomainDetails(domainName: string): Promise<DomainRegistration> {
    const response = await this.client.send(
      new GetDomainDetailCommand({
        DomainName: punycode.toASCII(domainName),
      }),
    );
    return {
      ...R53Transformers.DomainInfoTransformer.from(response),
      supportsDnssec: supportsDnssec(domainName),
    };
  }

  async getDomainStatus(domainName: string): Promise<RdapDomainStatus> {
    const command = new GetDomainDetailCommand({
      DomainName: punycode.toASCII(domainName), // required
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
    domainName: string,
    operation: DomainOwnershipOperation,
  ): Promise<PriceWithCurrency> {
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

  async getDomainPriceDetails(domainName: string): Promise<DomainPriceDetails> {
    const response = await this._getTldDomainsPricingFromDomainName({
      domainName,
    });
    return R53Transformers.DomainPriceDetailsTransformer.from(response);
  }

  async addDelegationSigner(
    domainName: string,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult<any>> {
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
    domainName: string,
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
    domainName: string,
    contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult<any>> {
    const command = new UpdateDomainContactCommand({
      DomainName: punycode.toASCII(domainName), // required
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

  async getDomainContacts(domainName: string): Promise<DomainContacts> {
    const response = await this.getDomainDetails(domainName);
    return response.contacts;
  }

  async setNameServers(
    domainName: string,
    nameservers: Nameserver[],
  ): Promise<LongRunningOperationResult<any>> {
    const response = await this.client.send(
      new UpdateDomainNameserversCommand({
        DomainName: punycode.toASCII(domainName),
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

  async getNameServers(domainName: string): Promise<Nameservers> {
    const response = await this.getDomainDetails(domainName);
    assertNotNil(response.nameservers, 'Nameservers are not available');
    return response.nameservers;
  }

  async getOperationStatus(
    domainName: string,
    operationId: string,
  ): Promise<LongRunningOperationResult> {
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
    domainName: string,
    option: RenewOption,
  ): Promise<LongRunningOperationResult<any>> {
    const input = {
      DomainName: punycode.toASCII(domainName),
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

  async getRenewOption(domainName: string): Promise<RenewOption> {
    const response = await this.getDomainDetails(domainName);
    return response.autoRenewOption;
  }

  async updateDomainContactsPrivacy(
    domainName: string,
    privacy: ContactsMap<DomainContactPrivacyEnum>,
  ): Promise<LongRunningOperationResult<any>> {
    const command = new UpdateDomainContactPrivacyCommand({
      DomainName: punycode.toASCII(domainName), // required
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
          domainName: DomainName,
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
  }: { domainName: string }): Promise<DomainPrice> {
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
    domainName: string;
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
        domainName: DomainName,
        availability: (Availability as any) || 'UNAVAILABLE',
        price,
      });
    }

    return finalOutput;
  }
}
type TldPrices = DomainPrice;
export type GetDomainSuggestionsWithPricesOutput = {
  domainName: string;
  availability: DomainAvailability;
  price: TldPrices;
}[];

// export type TransferDomainInput = {
//   domainName: string;
//   duration: number;
//   autoRenew: boolean;
//   privacy: boolean;
//   authCode: string;
//   contacts: {
//     technicalContact?: TransferDomainCommandInput['TechContact'];
//     adminContact?: TransferDomainCommandInput['AdminContact'];
//     registrantContact: TransferDomainCommandInput['RegistrantContact'];
//   };
//   nameServers?: TransferDomainCommandInput['Nameservers'];
// };
