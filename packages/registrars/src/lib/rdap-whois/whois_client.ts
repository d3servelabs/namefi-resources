import { matchAny } from '@namefi-astra/utils/match';
import axios from 'axios';
import { map, toLower } from 'ramda';
import type { GetLockStateResponse } from './get-lock-state-response';

type WhoisJsonApi = {
  WhoisData: {
    domain: {
      id: string;
      domain: string;
      punycode: string;
      name: string;
      extension: string;
      whois_server: string;
      status: string[];
      name_servers: string[];
      created_date: string;
      created_date_in_time: string;
      updated_date: string;
      updated_date_in_time: string;
      expiration_date: string;
      expiration_date_in_time: string;
    };
    registrar: RegistrarInfo;
    registrant: RegistrantInfo;
  };
};

export type RegistrantInfo = {
  id: string;
  name: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  phone: string;
  phone_ext: string;
  fax: string;
  fax_ext: string;
  email: string;
};

export type RegistrarInfo = {
  name: string;
  phone: string;
  email: string;
  referral_url: string;
};

export interface IWhoisClient {
  queryDomain(domain: string): Promise<WhoisJsonApi['WhoisData']>;
  queryDomainStatus(
    domain: string,
    whoisData?: WhoisJsonApi['WhoisData'],
  ): Promise<{ status: string[] }>;
  getLockState(domain: string): Promise<GetLockStateResponse>;
  getRegistrarInfoFromWhoisResponse(
    whoisData: WhoisJsonApi['WhoisData'],
  ): RegistrarInfo;
  getExpiryDateFromWhoisResponse(whoisData: WhoisJsonApi['WhoisData']): Date;
}

export type WhoisClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
};

export class WhoisJsonApiClient implements IWhoisClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly resolveApiKey: () => string | undefined;

  constructor(options: WhoisClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://whoisjsonapi.com/v1';
    this.timeoutMs = options.timeoutMs ?? 5000;
    // Resolve the API key lazily so callers can set `process.env.WHOIS_API_KEY`
    // after the client is constructed and still pick up the current value.
    this.resolveApiKey =
      options.apiKey !== undefined
        ? () => options.apiKey
        : () => process.env.WHOIS_API_KEY;
  }

  async queryDomain(domain: string): Promise<WhoisJsonApi['WhoisData']> {
    const res = await axios.get(
      `${this.baseUrl}/${domain}?apiKey=${this.resolveApiKey() ?? ''}`,
      {
        timeout: this.timeoutMs,
      },
    );
    return res.data;
  }

  async queryDomainStatus(
    domain: string,
    whoisData?: WhoisJsonApi['WhoisData'],
  ): Promise<{ status: string[] }> {
    const _whoisData = whoisData ?? (await this.queryDomain(domain));
    return {
      status: _whoisData.domain.status,
    };
  }

  async getLockState(domain: string): Promise<GetLockStateResponse> {
    const { status } = await this.queryDomainStatus(domain);
    const statusArray = status;
    const lowercaseStatuses = map(toLower, statusArray);
    const prohibited = lowercaseStatuses.some((value) =>
      matchAny(
        toLower(value),
        toLower('serverTransferProhibited'),
        toLower('serverUpdateProhibited'),
        toLower('clientTransferProhibited'),
        toLower('clientUpdateProhibited'),
      ),
    );
    const isAddPeriod = lowercaseStatuses.includes(toLower('addPeriod'));
    const isTransferPeriod = lowercaseStatuses.includes(
      toLower('transferPeriod'),
    );

    return {
      locked: prohibited,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: statusArray as any, //todo convert them to rdap
      isAddPeriod,
      isTransferPeriod,
    };
  }

  getRegistrarInfoFromWhoisResponse(
    whoisData: WhoisJsonApi['WhoisData'],
  ): RegistrarInfo {
    return whoisData.registrar;
  }

  getExpiryDateFromWhoisResponse(whoisData: WhoisJsonApi['WhoisData']): Date {
    return new Date(whoisData.domain.expiration_date_in_time);
  }
}

let _instance: IWhoisClient | undefined;
let _factory: () => IWhoisClient = () => new WhoisJsonApiClient();

/**
 * Lazily resolves the singleton WHOIS client. The first call instantiates the
 * configured factory; subsequent calls return the cached instance.
 */
export function getWhoisClient(): IWhoisClient {
  if (!_instance) {
    _instance = _factory();
  }
  return _instance;
}

/**
 * Override the WHOIS client (e.g. for dev or tests). Pass `undefined` to clear.
 */
export function setWhoisClient(client: IWhoisClient | undefined): void {
  _instance = client;
}

/**
 * Override the factory used to lazily instantiate the default WHOIS client.
 * Clears any previously cached instance so the next `getWhoisClient()` call
 * uses the new factory.
 */
export function setWhoisClientFactory(factory: () => IWhoisClient): void {
  _factory = factory;
  _instance = undefined;
}

/**
 * Reset the WHOIS client to the default factory and clear any cached instance.
 */
export function resetWhoisClient(): void {
  _factory = () => new WhoisJsonApiClient();
  _instance = undefined;
}

/**
 * Backwards-compatible facade. Delegates each call to the lazily-resolved
 * client returned by `getWhoisClient()`, so callers picking up a mock via
 * `setWhoisClient()` see the override transparently.
 */
export const WhoisClient: IWhoisClient = {
  queryDomain: (domain) => getWhoisClient().queryDomain(domain),
  queryDomainStatus: (domain, whoisData) =>
    getWhoisClient().queryDomainStatus(domain, whoisData),
  getLockState: (domain) => getWhoisClient().getLockState(domain),
  getRegistrarInfoFromWhoisResponse: (whoisData) =>
    getWhoisClient().getRegistrarInfoFromWhoisResponse(whoisData),
  getExpiryDateFromWhoisResponse: (whoisData) =>
    getWhoisClient().getExpiryDateFromWhoisResponse(whoisData),
};
