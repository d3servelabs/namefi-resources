// import {
//   AssociateDelegationSignerToDomainCommand,
//   CheckDomainAvailabilityCommand,
//   CheckDomainTransferabilityCommand,
//   DisableDomainAutoRenewCommand,
//   DisableDomainTransferLockCommand,
//   DisassociateDelegationSignerFromDomainCommand,
//   EnableDomainAutoRenewCommand,
//   EnableDomainTransferLockCommand,
//   GetDomainDetailCommand,
//   GetDomainSuggestionsCommand,
//   GetOperationDetailCommand,
//   ListDomainsCommand,
//   ListPricesCommand,
//   RegisterDomainCommand,
//   RenewDomainCommand,
//   RetrieveDomainAuthCodeCommand,
//   Route53DomainsClient,
//   TransferDomainCommand,
//   UpdateDomainContactCommand,
//   UpdateDomainContactPrivacyCommand,
//   UpdateDomainNameserversCommand,
// } from '@aws-sdk/client-route-53-domains';

// import type {
//   AssociateDelegationSignerToDomainCommandOutput,
//   CheckDomainTransferabilityCommandInput,
//   ContactDetail,
//   DisableDomainAutoRenewCommandOutput,
//   DisableDomainTransferLockCommandOutput,
//   DisassociateDelegationSignerFromDomainCommandOutput,
//   DomainAvailability,
//   DomainPrice,
//   DomainSummary,
//   EnableDomainAutoRenewCommandOutput,
//   EnableDomainTransferLockCommandOutput,
//   GetDomainSuggestionsCommandInput,
//   ListDomainsCommandInput,
//   ListPricesCommandInput,
//   ListPricesCommandOutput,
//   Nameserver,
//   RegisterDomainCommandInput,
//   RenewDomainCommandOutput,
//   TransferDomainCommandInput,
//   UpdateDomainContactCommandOutput,
// } from '@aws-sdk/client-route-53-domains';

// import punycode from 'node:punycode';
// import { isNil } from 'lodash';
// import pino from 'pino';
// import { config, secrets } from '#/lib/env';
// import { IdnLanguageCodeISO639_2 } from './idn/idn-language-code';

// export class Route53DomainsService extends Route53DomainsClient {
//   logger = pino({
//     name: 'Route53DomainsService',
//   });
//   priceMap: Record<
//     any,
//     NonNullable<ListPricesCommandOutput['Prices']>[number]
//   > = {};

//   constructor() {
//     super({
//       region: config.AWS_REGION,
//       credentials: {
//         accessKeyId: secrets.AWS_ACCESS_KEY_ID,
//         secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
//       },
//     });
//     this.updatePrices();
//   }

//   getDomainSuggestions(input: {
//     domainName: string;
//     suggestionsCount?: GetDomainSuggestionsCommandInput['SuggestionCount'];
//     onlyAvailable?: GetDomainSuggestionsCommandInput['OnlyAvailable'];
//   }) {
//     const command = new GetDomainSuggestionsCommand({
//       DomainName: punycode.toASCII(input.domainName), // required
//       SuggestionCount: input.suggestionsCount || 20, // required
//       OnlyAvailable: input.onlyAvailable ?? true, // required
//     });
//     return this.send(command);
//   }

//   async getTldDomainsPricing({
//     domainName,
//   }: { domainName: string }): Promise<DomainPrice> {
//     const levels = domainName.split('.');
//     const tld = levels.pop();
//     if (isNil(tld)) {
//       this.logger.error(`could not determine price for ${domainName}`);
//       throw new Error(`could not determine price for ${domainName}`);
//     }
//     if (!this.priceMap[tld]) {
//       const res = (await this.listPricesCommand({ Tld: tld }))?.Prices?.[0];
//       if (res) {
//         this.priceMap[tld] = res;
//       }
//     }
//     return this.priceMap[tld];
//   }

//   async getDomainSuggestionsWithPrices(input: {
//     domainName: string;
//     suggestionsCount?: number;
//     onlyAvailable?: boolean;
//   }): Promise<GetDomainSuggestionsWithPricesOutput> {
//     if (!input.suggestionsCount || input.suggestionsCount <= 0) {
//       return [];
//     }
//     const suggestions = await this.getDomainSuggestions({
//       domainName: punycode.toASCII(input.domainName),
//       suggestionsCount: input.suggestionsCount || 10,
//       onlyAvailable: input.onlyAvailable ?? true,
//     });

//     const finalOutput: GetDomainSuggestionsWithPricesOutput = [];
//     for (const { DomainName, Availability } of suggestions?.SuggestionsList ??
//       []) {
//       if (!DomainName) {
//         continue;
//       }
//       const [_, tld] = DomainName.split('.');

//       if (!this.priceMap[tld]) {
//         const res = (await this.listPricesCommand({ Tld: tld }))?.Prices?.[0];
//         if (res) {
//           this.priceMap[tld] = res;
//         }
//       }
//       const price = this.priceMap[tld];

//       finalOutput.push({
//         domainName: DomainName,
//         availability: (Availability as any) || 'UNAVAILABLE',
//         price,
//       });
//     }

//     return finalOutput;
//   }

//   checkDomainAvailabilityRequest({ domainName }: { domainName: string }) {
//     const command = new CheckDomainAvailabilityCommand({
//       DomainName: punycode.toASCII(domainName), // required
//     });
//     return this.send(command);
//   }

//   getOperationDetailCommand(operationId: string) {
//     const command = new GetOperationDetailCommand({ OperationId: operationId });
//     return this.send(command);
//   }

//   listPricesCommand(input: ListPricesCommandInput) {
//     const command = new ListPricesCommand(input); //todo punycode
//     return this.send(command);
//   }

//   async registerDomain({
//     domainName,
//     duration,
//     autoRenew,
//     privacy = true,
//     contacts,
//   }: {
//     domainName: string;
//     duration?: number;
//     autoRenew?: boolean;
//     privacy?: boolean;
//     contacts: {
//       registrantContact: ContactDetail;
//       adminContact?: ContactDetail;
//       technicalContact?: ContactDetail;
//     };
//   }) {
//     const input = {
//       // RegisterDomainRequest
//       IdnLangCode: IdnLanguageCodeISO639_2(domainName),
//       DomainName: punycode.toASCII(domainName), // required
//       DurationInYears: duration || 1, // required
//       AutoRenew: Boolean(autoRenew),
//       RegistrantContact: contacts.registrantContact,
//       AdminContact: contacts.adminContact || contacts.registrantContact,
//       TechContact: contacts.technicalContact || contacts.registrantContact,
//       PrivacyProtectAdminContact: Boolean(privacy),
//       PrivacyProtectRegistrantContact: Boolean(privacy),
//       PrivacyProtectTechContact: Boolean(privacy),
//     } as RegisterDomainCommandInput;
//     const command = new RegisterDomainCommand(input);
//     return await this.send(command);
//   }

//   async transferDomain({
//     domainName,
//     duration,
//     autoRenew,
//     privacy,
//     authCode,
//     contacts,
//     nameServers,
//   }: TransferDomainInput) {
//     const input: TransferDomainCommandInput = {
//       IdnLangCode: IdnLanguageCodeISO639_2(domainName),
//       DomainName: punycode.toASCII(domainName), // required
//       DurationInYears: duration || 1, // required
//       AutoRenew: Boolean(autoRenew),
//       RegistrantContact: contacts.registrantContact,
//       AdminContact: contacts.adminContact || contacts.registrantContact,
//       TechContact: contacts.technicalContact || contacts.registrantContact,
//       PrivacyProtectAdminContact: Boolean(privacy),
//       PrivacyProtectRegistrantContact: Boolean(privacy),
//       PrivacyProtectTechContact: Boolean(privacy),
//       AuthCode: authCode,
//       Nameservers: nameServers,
//     };
//     return await this.send(new TransferDomainCommand(input));
//   }

//   async checkDomainTransferability({
//     domainName,
//     authCode,
//   }: { domainName: string; authCode: string }) {
//     const input: CheckDomainTransferabilityCommandInput = {
//       // CheckDomainTransferabilityRequest
//       DomainName: punycode.toASCII(domainName), // required
//       AuthCode: authCode,
//     };
//     return await this.send(new CheckDomainTransferabilityCommand(input));
//   }

//   changeDomainLock<B extends true | false | undefined>({
//     domainName,
//     enable,
//   }: {
//     domainName: string;
//     enable?: B;
//   }): Promise<
//     B extends true
//       ? EnableDomainTransferLockCommandOutput
//       : DisableDomainTransferLockCommandOutput
//   > {
//     const input = {
//       DomainName: punycode.toASCII(domainName),
//     };
//     const command = enable
//       ? new EnableDomainTransferLockCommand(input)
//       : new DisableDomainTransferLockCommand(input);
//     return this.send(command);
//   }

//   changeDomainAutoRenew<B extends true | false | undefined>({
//     domainName,
//     enable,
//   }: {
//     domainName: string;
//     enable?: B;
//   }): Promise<
//     B extends true
//       ? EnableDomainAutoRenewCommandOutput
//       : DisableDomainAutoRenewCommandOutput
//   > {
//     const input = {
//       DomainName: punycode.toASCII(domainName),
//     };
//     const command = enable
//       ? new EnableDomainAutoRenewCommand(input)
//       : new DisableDomainAutoRenewCommand(input);
//     return this.send(command);
//   }

//   lockDomain({ domainName }: { domainName: string }) {
//     const command = new EnableDomainTransferLockCommand({
//       DomainName: punycode.toASCII(domainName),
//     });
//     return this.send(command);
//   }

//   unlockDomain({ domainName }: { domainName: string }) {
//     const command = new DisableDomainTransferLockCommand({
//       DomainName: punycode.toASCII(domainName),
//     });
//     return this.send(command);
//   }

//   getDomainDetails({ domainName }: { domainName: string }) {
//     const command = new GetDomainDetailCommand({
//       DomainName: punycode.toASCII(domainName), // required
//     });
//     return this.send(command);
//   }

//   retrieveAuthorizationCode({ domainName }: { domainName: string }) {
//     const input = {
//       // RetrieveDomainAuthCodeRequest
//       DomainName: punycode.toASCII(domainName), // required
//     };
//     const command = new RetrieveDomainAuthCodeCommand(input);
//     return this.send(command);
//   }

//   updateDomainContactPrivacy(param: {
//     domainName: string;
//     techPrivacy: boolean;
//     registrantPrivacy: boolean;
//     adminPrivacy: boolean;
//   }) {
//     const command = new UpdateDomainContactPrivacyCommand({
//       DomainName: punycode.toASCII(param.domainName), // required
//       AdminPrivacy: param.adminPrivacy,
//       RegistrantPrivacy: param.registrantPrivacy,
//       TechPrivacy: param.techPrivacy,
//     });
//     return this.send(command);
//   }

//   updateDomainContacts(param: {
//     domainName: string;
//     contacts: {
//       registrantContact?: ContactDetail;
//       techContact?: ContactDetail;
//       adminContact?: ContactDetail;
//     };
//   }): Promise<UpdateDomainContactCommandOutput> {
//     const command = new UpdateDomainContactCommand({
//       DomainName: punycode.toASCII(param.domainName), // required
//       RegistrantContact: param.contacts.registrantContact,
//       AdminContact: param.contacts.adminContact,
//       TechContact: param.contacts.techContact,
//     });
//     return this.send(command);
//   }

//   updateNameservers(param: {
//     domainName: string;
//     nameservers: Nameserver[];
//   }): Promise<UpdateDomainContactCommandOutput> {
//     const command = new UpdateDomainNameserversCommand({
//       DomainName: punycode.toASCII(param.domainName),
//       Nameservers: param.nameservers,
//     });
//     return this.send(command);
//   }

//   renewDomain(param: {
//     domainName: string;
//     durationInYears: number;
//     currentExpiryYear: number;
//   }): Promise<RenewDomainCommandOutput> {
//     const command = new RenewDomainCommand({
//       DomainName: punycode.toASCII(param.domainName),
//       DurationInYears: param.durationInYears,
//       CurrentExpiryYear: param.currentExpiryYear,
//     });
//     return this.send(command);
//   }

//   associateDelegationSignerToDomain(param: {
//     domainName: string;
//     signingAttributes: {
//       algorithm?: number;
//       flags?: number;
//       publicKey?: string;
//     };
//   }): Promise<AssociateDelegationSignerToDomainCommandOutput> {
//     const command = new AssociateDelegationSignerToDomainCommand({
//       DomainName: param.domainName,
//       SigningAttributes: {
//         Algorithm: param.signingAttributes.algorithm,
//         Flags: param.signingAttributes.flags,
//         PublicKey: param.signingAttributes.publicKey,
//       },
//     });
//     return this.send(command);
//   }

//   disassociateDelegationSignerToDomain(param: {
//     domainName: string;
//     id: string;
//   }): Promise<DisassociateDelegationSignerFromDomainCommandOutput> {
//     const command = new DisassociateDelegationSignerFromDomainCommand({
//       DomainName: param.domainName,
//       Id: param.id,
//     });
//     return this.send(command);
//   }

//   async updatePrices() {
//     try {
//       const res = await this.listPricesCommand({ MaxItems: 1000 });
//       res.Prices?.forEach((prices) => {
//         if (prices.Name) {
//           this.priceMap[prices.Name] = prices;
//         }
//       });
//       return this.priceMap;
//     } catch (e) {
//       this.logger.error(e);
//     }
//   }

//   async getAllTldsPricing() {
//     return this.priceMap ?? (await this.updatePrices());
//   }

//   async listAllDomains() {
//     const output: DomainSummary[] = [];

//     let marker: string | undefined;

//     do {
//       const input: ListDomainsCommandInput = {
//         SortCondition: {
//           Name: 'Expiry', // required
//           SortOrder: 'DESC', // required
//         },
//         Marker: marker,
//         MaxItems: 100,
//       };
//       const command = new ListDomainsCommand(input);
//       const response = await this.send(command);
//       marker = response.NextPageMarker;
//       output.push(...(response.Domains ?? []));
//     } while (marker);

//     return output;
//   }
// }

// type TldPrices = DomainPrice;
// export type GetDomainSuggestionsWithPricesOutput = {
//   domainName: string;
//   availability: DomainAvailability;
//   price: TldPrices;
// }[];

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
