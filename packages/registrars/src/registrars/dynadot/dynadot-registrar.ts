import punycode from 'node:punycode';
import { assertNot, assertNotNil, parseJsonOrNull } from '@namefi-astra/utils';
import { differenceInMinutes } from 'date-fns';
import { HttpsProxyAgent } from 'https-proxy-agent';
import pino from 'pino';
import { compose, head, isEmpty, isNil, prop } from 'ramda';
import type {
  ContactsMap,
  DnssecKey,
  DomainContacts,
  DomainPricingDetails,
  DomainRegistration,
  DomainSuggestionsQueryResult,
  DomainSummary,
  Nameserver,
  Nameservers,
  PricingDetails,
  RdapDomainStatus,
} from '#lib/abstract-registrar';
import {
  AbstractRegistrarService,
  DomainAvailability,
  DomainContactPrivacyEnum,
  DomainOwnershipOperation,
  OperationStatus,
  OperationType,
  type PriceWithCurrency,
  RenewOption,
  multiYearPricingTemplate,
  singleYearPricingTemplate,
} from '#lib/abstract-registrar';
import type {
  DomainsQueryResult,
  LongRunningOperationResult,
  RegisterDomainInput,
  RenewDomainInput,
  TransferDomainInput,
  VerifyTransferInAuthCodeOutput,
} from '#lib/abstract-registrar';
import {
  type PunycodeDomainName,
  assertPunycodeDomainName,
  toPunycodeDomainName,
  toPunycodeFqdn,
} from '#lib/data/validations';
import type {
  DynadotDomainInfo,
  DynadotLockDomainCommandOutput,
  DynadotRegisterCommandOutput,
  DynadotRenewCommandOutput,
  DynadotResponseCode,
  DynadotResponseStatus,
  DynadotSetRenewOptionCommandOutput,
  ProxyOptions,
} from '#lib/dynadot/index';
import {
  Dynadot,
  DynadotCommand,
  DynadotTransferStatus,
} from '#lib/dynadot/index';
import { IdnLanguageCodeISO639_2 } from '#lib/idn/idn-language-code';
import { RDAP } from '#lib/rdap-whois/rdap_client';
import { supportsDnssec } from '#lib/supports-dnssec';
import { Registrars } from '../registrars-keys';
import { fromDynadotContactsMap } from './helpers';

const DYNADOT_DOMAIN_REGISTER_CHECK_TIME_WINDOW_IN_MINUTES = 30;

export class DynadotRegistrarService extends AbstractRegistrarService<Registrars> {
  key = Registrars.Dynadot;
  readonly logger: pino.Logger;
  private readonly client: Dynadot;

  constructor(config: {
    DYNADOT_API_KEY: string;
    DYNADOT_PRIVATE_KEY?: string;
    DYNADOT_ACCOUNT_ID?: string;
    DYNADOT_HTTPS_PROXY_AGENT?: string;
    DYNADOT_CONFIG_LOG_SYSTEM_BUSY?: boolean;
    DYNADOT_CONFIG_RETRY_COUNT?: number;
    DYNADOT_CONFIG_RETRY_WHEN_BUSY?: boolean;
    DYNADOT_CONFIG_RETRY_BACKOFF?: number;
    DYNADOT_BASE_URL?: string;
    customLogger?: pino.Logger;
  }) {
    super();
    this.logger =
      config.customLogger ?? pino({ name: DynadotRegistrarService.name });
    this.logger.info('DynadotRegistrarService constructor');

    let proxyOptions: ProxyOptions | undefined;

    if (config.DYNADOT_PRIVATE_KEY && config.DYNADOT_ACCOUNT_ID) {
      proxyOptions = {
        namefiProxy: {
          privateKey: Buffer.from(
            config.DYNADOT_PRIVATE_KEY,
            'base64',
          ).toString('utf8'),
          accountId: config.DYNADOT_ACCOUNT_ID,
        },
      };
    } else if (config.DYNADOT_HTTPS_PROXY_AGENT) {
      proxyOptions = {
        httpsAgent: new HttpsProxyAgent(config.DYNADOT_HTTPS_PROXY_AGENT),
      };
    }
    this.client = new Dynadot({
      apiKey: config.DYNADOT_API_KEY,
      baseUrl: config.DYNADOT_BASE_URL,
      loggingOptions: {
        enabled: true,
        prefix: Dynadot.name,
        allowSystemBusyLog: config.DYNADOT_CONFIG_LOG_SYSTEM_BUSY,
        customLogger: config.customLogger,
        blackList(params: any) {
          return params?.command === DynadotCommand.tld_price;
        },
      },
      ...(proxyOptions ? { proxyOptions } : {}),
      retryOptions: {
        maxRetries: config.DYNADOT_CONFIG_RETRY_COUNT ?? 3,
        retryWhenBusy: config.DYNADOT_CONFIG_RETRY_WHEN_BUSY ?? true,
        backoff: config.DYNADOT_CONFIG_RETRY_BACKOFF ?? 1000,
      },
    });
  }

  async registerDomain(
    args: RegisterDomainInput,
  ): Promise<LongRunningOperationResult<DynadotRegisterCommandOutput>> {
    //todo validate price
    const { domainName, durationInYears } = args;

    assertPunycodeDomainName(domainName);
    assertNotNil(durationInYears, 'Duration in years is required');

    const privacy =
      args.privacy !== DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA;
    //todo handle privacy
    //todo handle contacts
    const searchRes = await this.searchForDomain(domainName);

    const response = await this.client.command(DynadotCommand.register, {
      domain: domainName,
      duration: durationInYears,
      language: IdnLanguageCodeISO639_2(domainName),
      premium: searchRes.result.isPremium ? '1' : undefined,
    });

    assertNot(responseFailed(response.RegisterResponse), 'Response Failed');

    if (response.RegisterResponse.Status === 'success') {
      return {
        operationId: generateOperationId(
          OperationType.REGISTER_DOMAIN,
          domainName,
        ),
        status: getImmediateOperationStatus(response.RegisterResponse),
        response,
        type: OperationType.REGISTER_DOMAIN,
      };
    }

    return {
      operationId: generateOperationId(
        OperationType.REGISTER_DOMAIN,
        domainName,
      ),
      status: OperationStatus.FAILED,
      response,
      type: OperationType.REGISTER_DOMAIN,
    };
  }

  async renewDomain(
    args: RenewDomainInput,
  ): Promise<LongRunningOperationResult<DynadotRenewCommandOutput>> {
    assertPunycodeDomainName(args.domainName);

    const response = await this.client.command(DynadotCommand.renew, {
      domain: args.domainName,
      duration: args.durationInYears,
      no_renew_if_late_renew_fee_needed: 1,
    });
    assertNot(responseFailed(response.RenewResponse), 'Response Failed');
    return {
      type: OperationType.RENEW_DOMAIN,
      operationId: generateOperationId(
        OperationType.RENEW_DOMAIN,
        args.domainName,
        {
          status: getImmediateOperationStatus(response.RenewResponse),
        },
      ),
      status: getImmediateOperationStatus(response.RenewResponse),
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

    //todo handle contacts, privacy, nameservers, [x]duration, [x] renew
    const response = await this.client.command(DynadotCommand.transfer, {
      domain: domainName,
      currency: 'USD',
      auth: authCode,
    });

    assertNot(responseFailed(response.TransferResponse), 'Response Failed');

    return {
      type: OperationType.TRANSFER_IN_DOMAIN,
      operationId: generateOperationId(
        OperationType.TRANSFER_IN_DOMAIN,
        args.domainName,
      ),
      status: getRunningOperationStatus(response.TransferResponse),
      response,
    };
  }

  async renewAuthCode(domainName: PunycodeDomainName): Promise<string> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(
      DynadotCommand.get_transfer_auth_code,
      {
        domain: domainName,
        new_code: 1,
      },
    );
    assertNot(
      responseFailed(response.GetTransferAuthCodeResponse),
      'Response Failed',
    );

    return response.GetTransferAuthCodeResponse.AuthCode;
  }

  async retrieveAuthCode(domainName: PunycodeDomainName): Promise<string> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(
      DynadotCommand.get_transfer_auth_code,
      {
        domain: domainName,
      },
    );
    assertNot(
      responseFailed(response.GetTransferAuthCodeResponse),
      'Response Failed',
    );

    return response.GetTransferAuthCodeResponse.AuthCode;
  }

  verifyAuthCode(
    domainName: PunycodeDomainName,
    authCode: string,
  ): Promise<VerifyTransferInAuthCodeOutput> {
    return new Promise((resolve) => {
      resolve({
        transferable: true,
        response: {},
      });
    });
  }

  async lockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<DynadotLockDomainCommandOutput>> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.lock_domain, {
      domain: domainName,
    });
    assertNot(responseFailed(response.LockDomainResponse), 'Response Failed');

    return {
      type: OperationType.DOMAIN_CHANGE_LOCK,
      operationId: generateOperationId(
        OperationType.DOMAIN_CHANGE_LOCK,
        domainName,
        {
          status: getImmediateOperationStatus(response.LockDomainResponse),
        },
      ),
      status: getImmediateOperationStatus(response.LockDomainResponse),
      response,
    };
  }

  async unlockDomain(
    domainName: PunycodeDomainName,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.unlock_domain, {
      domain: domainName,
    });

    assertNot(responseFailed(response.UnlockDomainResponse), 'Response Failed');

    return {
      type: OperationType.DOMAIN_CHANGE_LOCK,
      operationId: generateOperationId(
        OperationType.DOMAIN_CHANGE_LOCK,
        domainName,
        {
          status: getImmediateOperationStatus(response.UnlockDomainResponse),
        },
      ),
      status: getImmediateOperationStatus(response.UnlockDomainResponse),
      response: {},
    };
  }

  async _getDomainInfo(domainName: PunycodeDomainName) {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.domain_info, {
      domain: domainName,
    });

    assertNot(
      responseFailed(response.DomainInfoResponse),
      'Dynadot: Domain Info Response Failed',
    );
    return response.DomainInfoResponse.DomainInfo;
  }

  async _checkDomainRegister(
    domainName: PunycodeDomainName,
    operationId: string,
    timestamp: Date,
  ): Promise<LongRunningOperationResult> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.domain_info, {
      domain: domainName,
    });

    // NOTE: Check if the operation is within the 30-minute window after submission as per Dynadot recommendation
    const isWithin30MinsAfterSubmission =
      differenceInMinutes(new Date(), timestamp) <
      DYNADOT_DOMAIN_REGISTER_CHECK_TIME_WINDOW_IN_MINUTES;

    if (
      response.DomainInfoResponse.Error ===
      'could not find domain in your account'
    ) {
      // NOTE: If the domain is not found in your account, check if the operation is within the 30-minute window after submission as per Dynadot recommendation
      if (isWithin30MinsAfterSubmission) {
        return {
          status: OperationStatus.IN_PROGRESS,
          response: response.DomainInfoResponse,
          operationId,
          type: OperationType.REGISTER_DOMAIN,
        };
      }
      return {
        status: OperationStatus.FAILED,
        response: response.DomainInfoResponse,
        operationId,
        type: OperationType.REGISTER_DOMAIN,
        message: response.DomainInfoResponse.Error,
      };
    }
    return response.DomainInfoResponse.DomainInfo?.Expiration
      ? {
          status: OperationStatus.SUCCESSFUL,
          response: response.DomainInfoResponse,
          operationId,
          type: OperationType.REGISTER_DOMAIN,
        }
      : {
          status: OperationStatus.IN_PROGRESS,
          response: response.DomainInfoResponse,
          operationId,
          type: OperationType.REGISTER_DOMAIN,
        };
  }

  async getDomainDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainRegistration> {
    assertPunycodeDomainName(domainName);

    const domainInfo = await this._getDomainInfo(domainName);
    if (isNil(domainInfo)) {
      throw new Error('Domain Not Found');
    }
    const [
      nameservers,
      [RegistrantContact, AdminContact, TechContact, BillingContact],
    ] = await Promise.all([
      this.getNameServers(domainName),
      this._getContactList([
        domainInfo.Whois.Registrant.ContactId,
        domainInfo.Whois.Admin.ContactId,
        domainInfo.Whois.Technical.ContactId,
        domainInfo.Whois.Billing.ContactId,
      ]),
    ]);

    if (isNil(RegistrantContact)) {
      throw new Error('Registrant Contact not found');
    }

    return {
      autoRenewOption:
        domainInfo.RenewOption === 'manual renewal'
          ? RenewOption.MANUAL
          : RenewOption.AUTOMATIC,
      creationTime: new Date(Number.parseFloat(domainInfo.Registration)),
      expirationTime: new Date(Number.parseFloat(domainInfo.Expiration)),
      domainName: toPunycodeDomainName(domainInfo.Name),
      nameservers: nameservers,
      contacts: fromDynadotContactsMap({
        RegistrantContact,
        AdminContact,
        TechContact,
        BillingContact,
      }),
      contactsPrivacy: {
        registrantContact:
          domainInfo.Privacy === 'full'
            ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
            : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
        adminContact:
          domainInfo.Privacy === 'full'
            ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
            : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
        technicalContact:
          domainInfo.Privacy === 'full'
            ? DomainContactPrivacyEnum.PRIVATE_CONTACT_DATA
            : DomainContactPrivacyEnum.PUBLIC_CONTACT_DATA,
      },
      dnssecKeys: [],
      supportsDnssec: supportsDnssec(domainName),
    };
  }

  async getDomainStatus(
    domainName: PunycodeDomainName,
  ): Promise<RdapDomainStatus> {
    assertPunycodeDomainName(domainName);

    const { status } = await RDAP.queryDomainStatus(domainName);
    return status;
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
      //   case DomainOwnershipOperation.CHANGE_OWNERSHIP:
      //     return prices.changeOwnershipPrice;
      // case DomainOwnershipOperation.RESTORE:
      //   return prices.restorationPrice;
      default:
        throw new Error('Invalid operation');
    }
  }

  async _getTldPrices(options = { useCachedValue: false }) {
    const response = await this.client.command(DynadotCommand.tld_price, {
      currency: 'USD',
    });

    assertNot(responseFailed(response.TldPriceResponse), 'Response Failed');
    return response.TldPriceResponse;
  }

  async getTldPrices(options = { useCachedValue: false }) {
    const response = await this._getTldPrices(options);
    if (response.Currency !== 'USD') {
      throw new Error('Unsupported currency');
    }
    return Object.fromEntries(
      response.TldPrice.map((value) => [
        value.Tld.replace(/^\./, ''),
        {
          registrationPrice: singleYearPricingTemplate(
            Math.ceil(Number.parseFloat(value.Price.Register)),
          ),
          renewalPrice: singleYearPricingTemplate(
            Math.ceil(Number.parseFloat(value.Price.Renew)),
          ),
          importPrice: singleYearPricingTemplate(
            Math.ceil(Number.parseFloat(value.Price.Transfer)),
          ),
          changeOwnershipPrice: singleYearPricingTemplate(0),
          restorationPrice: singleYearPricingTemplate(
            Math.ceil(Number.parseFloat(value.Price.Restore) * 10),
          ),
        } as DomainPricingDetails,
      ]),
    );
  }

  async getDomainPriceDetails(
    domainName: PunycodeDomainName,
  ): Promise<DomainPricingDetails> {
    assertPunycodeDomainName(domainName);
    const searchRes = await this.searchForDomain(domainName);
    const pricing = searchRes?.result?.price;
    assertNotNil(pricing, 'Pricing Not found');

    return pricing;
  }

  async _getNonPremiumDomainPriceDetails(
    domainName: PunycodeDomainName,
    options = { useCachedValue: false },
  ): Promise<DomainPricingDetails> {
    assertPunycodeDomainName(domainName);

    const response = await this._getTldPrices(options);
    const pricing = response.TldPrice.find((p) => domainName.endsWith(p.Tld));
    assertNotNil(pricing, 'Pricing Not found');

    const registerPrice = Math.ceil(Number.parseFloat(pricing.Price.Register));
    const renewPrice = Math.ceil(Number.parseFloat(pricing.Price.Renew));
    const prices = new Array(10)
      .fill(0)
      .map((_, index) => registerPrice + renewPrice * index);

    const registrationPrice =
      renewPrice > registerPrice
        ? multiYearPricingTemplate(prices)
        : singleYearPricingTemplate(registerPrice);

    return {
      registrationPrice: registrationPrice,
      renewalPrice: singleYearPricingTemplate(
        Math.ceil(Number.parseFloat(pricing.Price.Renew)),
      ),
      importPrice: singleYearPricingTemplate(
        Math.ceil(Number.parseFloat(pricing.Price.Transfer)),
      ),
    };
  }

  async addDelegationSigner(
    domainName: PunycodeDomainName,
    signingAttributes: DnssecKey,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    assertNotNil(signingAttributes.algorithm, 'Algorithm is required');
    assertNotNil(signingAttributes.publicKey, 'Public Key is required');
    assertNotNil(signingAttributes.keyTag, 'Key Tag is required');
    assertNotNil(signingAttributes.digestType, 'Digest Type is required');
    assertNotNil(signingAttributes.digest, 'Digest is required');
    const response = await this.client.command(DynadotCommand.set_dnssec, {
      domain_name: punycode.toASCII(domainName),
      algorithm: signingAttributes.algorithm,
      public_key: signingAttributes.publicKey,
      flags: signingAttributes.flags,
      key_tag: signingAttributes.keyTag,
      digest_type: signingAttributes.digestType,
      digest: signingAttributes.digest,
    });

    assertNot(responseFailed(response.SetDnssecResponse), 'Response Failed');
    return {
      type: OperationType.ADD_DNSSEC,
      operationId: generateOperationId(OperationType.ADD_DNSSEC, domainName, {
        status: getImmediateOperationStatus(response.SetDnssecResponse),
      }),
      status: getImmediateOperationStatus(response.SetDnssecResponse),
      response,
    };
  }

  async removeDelegationSigner(
    domainName: PunycodeDomainName,
    publicKeyOrId: string,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.clear_dnssec, {
      domain_name: domainName,
    });
    assertNot(responseFailed(response.ClearDnssecResponse), 'Response Failed');
    const status = getImmediateOperationStatus(response.ClearDnssecResponse);
    return {
      type: OperationType.REMOVE_DNSSEC,
      operationId: generateOperationId(
        OperationType.REMOVE_DNSSEC,
        domainName,
        {
          status,
        },
      ),
      status,
      response,
    };
  }

  async searchForDomain(
    query: PunycodeDomainName,
  ): Promise<
    DomainsQueryResult<Registrars> & { result: { isPremium?: boolean } }
  > {
    assertPunycodeDomainName(query);

    const response = await this.client.command(DynadotCommand.search, {
      currency: 'USD',
      show_price: '1',
      domain0: punycode.toASCII(query),
    });
    const nonPremiumPrices = await this._getNonPremiumDomainPriceDetails(
      query,
      {
        useCachedValue: true,
      },
    );
    assertNot(responseFailed(response.SearchResponse), 'Response Failed');
    const firstSearchResult = head(response.SearchResponse.SearchResults);

    if (
      !isNil(firstSearchResult.DomainName) &&
      firstSearchResult.DomainName.toLowerCase() === query.toLowerCase() &&
      (firstSearchResult.Status === 'success' ||
        firstSearchResult.Available === 'yes')
    ) {
      const parsedPrice = parseDomainPriceString(firstSearchResult.Price);
      let price: DomainPricingDetails = nonPremiumPrices;

      if (parsedPrice.isPremium) {
        if (
          !(
            parsedPrice.priceDetails?.registrationPrice &&
            parsedPrice.priceDetails?.renewalPrice
          )
        ) {
          throw new Error(
            `Price Details not found for premium domain(${firstSearchResult.DomainName})`,
          );
        }
        const registerPrice =
          parsedPrice.priceDetails?.registrationPrice?.amount;
        const renewPrice = parsedPrice.priceDetails?.renewalPrice?.amount;
        const prices = new Array(10)
          .fill(0)
          .map((_, index) => registerPrice + renewPrice * index);

        const registrationPrice =
          renewPrice > registerPrice
            ? multiYearPricingTemplate(prices)
            : singleYearPricingTemplate(registerPrice);
        price = {
          registrationPrice: registrationPrice,
          renewalPrice: singleYearPricingTemplate(renewPrice),
          importPrice: singleYearPricingTemplate(Number.NaN),
        };
      }

      return {
        result: {
          domainName: toPunycodeDomainName(firstSearchResult.DomainName),
          price,
          isPremium: parsedPrice.isPremium,
          available:
            firstSearchResult.Available === 'yes'
              ? DomainAvailability.AVAILABLE
              : DomainAvailability.UNAVAILABLE,
        },
        suggestions: [],
      };
    }

    return {
      result: {
        domainName: toPunycodeDomainName(query),
        price: nonPremiumPrices, //todo!! figure out transfer price for premium domains
        available: DomainAvailability.UNAVAILABLE,
        isPremium: false,
      },
      suggestions: [],
    };
  }

  async getSuggestions(
    query: PunycodeDomainName,
    suggestionsCount: number,
  ): Promise<DomainSuggestionsQueryResult<Registrars>> {
    assertPunycodeDomainName(query);

    const res = await this.searchForDomain(query);
    return { result: res.suggestions };
  }

  updateDomainContacts(
    domainName: PunycodeDomainName,
    contacts: Partial<DomainContacts>,
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);
    //todo NIT
    const response = {};
    return new Promise((resolve) => {
      resolve({
        type: OperationType.UPDATE_DOMAIN_CONTACT,
        operationId: generateOperationId(
          OperationType.UPDATE_DOMAIN_CONTACT,
          domainName,
        ),
        status: OperationStatus.SUBMITTED,
        response,
      });
    });
  }

  async getDomainContacts(
    domainName: PunycodeDomainName,
  ): Promise<DomainContacts> {
    assertPunycodeDomainName(domainName);

    const response = await this.getDomainDetails(domainName);
    return response.contacts;
  }

  async _getContact(contactId: string) {
    const response = await this.client.command(DynadotCommand.get_contact, {
      contact_id: contactId,
    });
    assertNot(responseFailed(response.GetContactResponse), 'Response Failed');
    return response.GetContactResponse.GetContact;
  }

  async _getContactList(contactIds: string[]) {
    const contactIdsSet = new Set(contactIds);
    const contactsMap = new Map(
      await Promise.all(
        Array.from(contactIdsSet).map(async (id) => {
          const contact = await this._getContact(id);
          return [id, contact] as const;
        }),
      ),
    );
    return contactIds.map((id) => contactsMap.get(id));
  }

  async setNameServers(
    domainName: PunycodeDomainName,
    nameservers: Nameserver[],
  ): Promise<LongRunningOperationResult<any>> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.set_ns, {
      domain: domainName,
      ...Object.fromEntries(nameservers.map((name, i) => [`ns${i}`, name])),
    });

    assertNot(responseFailed(response.SetNsResponse), 'Response Failed');
    return {
      type: OperationType.UPDATE_NAMESERVER,
      operationId: generateOperationId(
        OperationType.UPDATE_NAMESERVER,
        domainName,
      ),
      status: getImmediateOperationStatus(response.SetNsResponse),
      response,
    };
  }

  async getNameServers(domainName: PunycodeDomainName): Promise<Nameservers> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(DynadotCommand.get_ns, {
      domain: domainName,
    });

    assertNot(responseFailed(response.GetNsResponse), 'Response Failed');
    const nameservers = Object.entries(response.GetNsResponse.NsContent ?? {})
      .filter(([key]) => key.toLowerCase().startsWith('host'))
      .map(compose(toPunycodeFqdn, prop(1)));
    return nameservers;
  }

  async _getTransferStatus(domainName: PunycodeDomainName) {
    assertPunycodeDomainName(domainName);
    const response = await this.client.command(
      DynadotCommand.get_transfer_status,
      {
        domain: domainName,
        transfer_type: 'in',
      },
    );
    assertNot(
      responseFailed(response.GetTransferStatusResponse),
      'Response Failed',
    );
    return response.GetTransferStatusResponse.TransferList;
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
        const response = await this._getTransferStatus(domainNameLdh);
        assertNotNil(response, 'Response Failed');
        const latestStatus = response[0];
        let status: OperationStatus;
        switch (latestStatus.TransferStatus) {
          case DynadotTransferStatus.NONE:
            status = OperationStatus.SUBMITTED;
            break;
          case DynadotTransferStatus.WAITING:
          case DynadotTransferStatus.Approved:
            status = OperationStatus.IN_PROGRESS;
            break;

          case DynadotTransferStatus.LOCKED:
          case DynadotTransferStatus.AUTH_CODE_NEEDED:
            status = OperationStatus.ERROR;
            break;

          case DynadotTransferStatus.CANCELLED:
          case DynadotTransferStatus.FAILED:
            status = OperationStatus.FAILED;
            break;

          case DynadotTransferStatus.Transferred:
            status = OperationStatus.SUCCESSFUL;
            break;
          default:
            status = OperationStatus.ERROR;
            break;
        }
        return Promise.resolve({
          type: operationType,
          operationId,
          response,
          status,
        });
      }
      case OperationType.RENEW_DOMAIN:
      case OperationType.DOMAIN_CHANGE_LOCK:
      case OperationType.ADD_DNSSEC:
      case OperationType.REMOVE_DNSSEC:
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

  async setRenewOption(
    domainName: PunycodeDomainName,
    option: RenewOption,
  ): Promise<LongRunningOperationResult<DynadotSetRenewOptionCommandOutput>> {
    assertPunycodeDomainName(domainName);

    const response = await this.client.command(
      DynadotCommand.set_renew_option,
      {
        domain: domainName,
        renew_option: option === RenewOption.AUTOMATIC ? 'auto' : 'donot',
      },
    );
    return {
      response,
      type:
        option === RenewOption.AUTOMATIC
          ? OperationType.ENABLE_AUTORENEW
          : OperationType.DISABLE_AUTORENEW,
      status:
        response.SetRenewOptionResponse.Status === 'success'
          ? OperationStatus.SUCCESSFUL
          : OperationStatus.FAILED,
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

    const response = await this.client.command(DynadotCommand.set_privacy, {
      domain: domainName,
      option:
        privacy.registrantContact === 'PUBLIC_CONTACT_DATA' ? 'off' : 'full',
    });
    return {
      response,
      operationId: generateOperationId(
        OperationType.CHANGE_PRIVACY_PROTECTION,
        domainName,
      ),
      type: OperationType.CHANGE_PRIVACY_PROTECTION,
      status: getImmediateOperationStatus(response.SetPrivacyResponse),
    };
  }

  /**
   * Retrieves a list of all domains in the Dynadot account.
   *
   * @description
   * This method fetches all domains by paginating through the Dynadot API's
   * list_domain command.
   *
   * It handles pagination automatically by:
   * 1. Starting with page 0
   * 2. Fetching 5000 domains per page
   * 3. Continuing to next page until no more domains are found or an error occurs
   * TODO:(sami): consider adding a cache layer to this method
   *
   * @returns Promise<DomainSummary[]> Array of domain summaries containing:
   * - domainName: The name of the domain
   * - expirationTime: When the domain expires
   * - autoRenewOption: Whether the domain is set to auto-renew
   * - transferLocked: Whether the domain is locked for transfer
   *
   * @throws Will throw an error if the API request fails
   */
  async listAllDomains(): Promise<DomainSummary[]> {
    const domains: DynadotDomainInfo[] = [];
    let nextPage: number | null = 0;
    do {
      const res = await this.client.command(DynadotCommand.list_domain, {
        count_per_page: 5000,
        page_index: nextPage,
      });
      domains.push(...(res.ListDomainInfoResponse.MainDomains ?? []));
      if (
        res.ListDomainInfoResponse.ResponseCode !== '1' ||
        isEmpty(res.ListDomainInfoResponse.MainDomains ?? [])
      ) {
        nextPage = null;
      } else {
        nextPage++;
      }
    } while (nextPage !== null);

    return domains.map(({ RenewOption: Renew, Name, Locked, Expiration }) => ({
      domainName: toPunycodeDomainName(Name),
      expirationTime: new Date(Number.parseInt(Expiration)),
      autoRenewOption:
        Renew === 'manual renewal' ? RenewOption.MANUAL : RenewOption.AUTOMATIC,
      transferLocked: Locked === 'yes',
    }));
  }
}

function parsePriceForDomain(price: string | undefined | null) {
  return (price?.toLowerCase().split(/\s+and\s+/) ?? []).reduce(
    (acc, next) => {
      if (next.includes('price')) {
        const info = /(\w+) price: ([\d.]+) in (\w{3})/.exec(next);
        assertNotNil(info, 'Invalid price format');
        acc.prices.push({
          type: info[1] as any,
          amount: Math.ceil(Number.parseFloat(info[2])),
          currency: info[3].toUpperCase(),
        });
      } else if (next.includes('premium')) {
        acc.premium = next !== 'domain is not a premium domain';
      }

      return acc;
    },
    {
      prices: <
        { amount: number; currency: string; type: 'registration' | 'renewal' }[]
      >[],
      premium: false as boolean,
    },
  );
}

function parseDomainPriceString(price: string | undefined | null) {
  const parsedPrice = parsePriceForDomain(price);

  const priceDetails: Partial<
    Record<'registrationPrice' | 'renewalPrice', PriceWithCurrency>
  > = {};

  parsedPrice.prices.forEach((details) => {
    if (details.currency !== 'USD') {
      throw new Error('Unsupported currency');
    }
    switch (details.type) {
      case 'renewal':
        priceDetails.renewalPrice = {
          amount: details.amount,
          currency: details.currency,
        };
        break;
      case 'registration':
        priceDetails.registrationPrice = {
          amount: details.amount,
          currency: details.currency,
        };
        break;
      default:
        return;
    }
  });

  return { priceDetails, isPremium: parsedPrice.premium };
}

function getNonce(length: number) {
  return new Array(length)
    .fill(0)
    .map(() => Math.round(Math.random() * 9))
    .join('');
}

function responseFailed(args: { ResponseCode: DynadotResponseCode }) {
  const resCode = args.ResponseCode.toString();
  return resCode !== '0' && resCode !== '1';
}

const RADIX = 32;
const ID_SEP = ':::';

function generateOperationId(
  operationType: OperationType,
  domainName: PunycodeDomainName,
  extraData?: Record<string, any>,
) {
  return [
    operationType,
    domainName,
    Date.now().toString(RADIX),
    getNonce(4),
    Buffer.from(JSON.stringify(extraData ?? {})).toString('base64'),
  ].join(ID_SEP);
}

function parseOperationId(operationId: string) {
  const parts = operationId.split(ID_SEP);
  if (parts.length !== 5) {
    throw new Error('invalid-operationId');
  }

  return {
    operationType: parts[0] as OperationType,
    domainName: parts[1],
    timestamp: Number.parseInt(parts[2], RADIX),
    nonce: parts[3],
    extraData: parseJsonOrNull<any>(
      Buffer.from(parts[4], 'base64').toString('utf-8'),
    ),
  };
}

function getImmediateOperationStatus(response?: {
  ResponseCode: DynadotResponseCode;
  Status?: DynadotResponseStatus | string;
}) {
  return response?.Status === 'success' || response?.ResponseCode !== '-1'
    ? OperationStatus.SUCCESSFUL
    : OperationStatus.FAILED;
}

function getRunningOperationStatus(response?: {
  ResponseCode: DynadotResponseCode;
  Status?: DynadotResponseStatus | string;
}) {
  return response?.Status === 'success' || response?.ResponseCode !== '-1'
    ? OperationStatus.IN_PROGRESS
    : OperationStatus.FAILED;
}
