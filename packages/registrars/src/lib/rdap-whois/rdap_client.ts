import axios from 'axios';
import { isNil } from 'ramda';
import vCard from 'vcf';
import type { GetLockStateResponse } from './get-lock-state-response';
import type { RdapDomainStatus, RdapResponse } from './rdap-response';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type RegistrarInfo = { name: string; vCard?: any };

export interface IRdapClient {
  queryDomain(domain: string): Promise<RdapResponse>;
  queryDomainStatus(
    domain: string,
    rdapResponse?: RdapResponse,
  ): Promise<{ status: RdapDomainStatus[] }>;
  queryRegistrarInfo(domain: string): Promise<RegistrarInfo | null>;
  getLockState(domain: string): Promise<GetLockStateResponse>;
  getRegistrarInfoFromRdapResponse(
    rdapResponse: RdapResponse,
  ): RegistrarInfo | null;
  getExpiryDateFromRdapResponse(rdapResponse: RdapResponse): Date | null;
}

export type RdapClientOptions = {
  baseUrl?: string;
  timeoutMs?: number;
};

export class RdapClient implements IRdapClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(options: RdapClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? 'https://rdap.org';
    this.timeoutMs = options.timeoutMs ?? 5000;
  }

  async queryDomain(domain: string): Promise<RdapResponse> {
    console.trace('[RDAP] queryDomain', domain);
    try {
      const res = await axios.get(`${this.baseUrl}/domain/${domain}`, {
        timeout: this.timeoutMs,
      });
      return res.data;
    } catch (error) {
      console.trace('[RDAP] queryDomain', domain, error);
      throw error;
    }
  }

  async queryDomainStatus(
    domain: string,
    rdapResponse?: RdapResponse,
  ): Promise<{ status: RdapDomainStatus[] }> {
    const _rdapResponse = rdapResponse ?? (await this.queryDomain(domain));
    return {
      status: _rdapResponse.status,
    };
  }

  async getLockState(domain: string): Promise<GetLockStateResponse> {
    const { status } = await this.queryDomainStatus(domain);
    const prohibitedRegex = new RegExp(/(transfer|update) prohibited/g);

    let prohibited = false;
    let isAddPeriod = false;
    let isTransferPeriod = false;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    for (const value of status as any[]) {
      if (!isAddPeriod && value === 'add period') {
        isAddPeriod = true;
      } else if (!isTransferPeriod && value === 'transfer period') {
        isTransferPeriod = true;
      } else {
        if (prohibited && isTransferPeriod && isAddPeriod) {
          break;
        }
        prohibited ||= prohibitedRegex.test(value);
      }
    }
    return {
      locked: prohibited,
      status,
      isAddPeriod,
      isTransferPeriod,
    };
  }

  getRegistrarInfoFromRdapResponse(
    rdapResponse: RdapResponse,
  ): RegistrarInfo | null {
    const registrarEntity = rdapResponse.entities.find((entity) => {
      return entity.roles.includes('registrar');
    });
    if (isNil(registrarEntity)) {
      return null;
    }
    const vcardArray = registrarEntity?.vcardArray;
    if (isNil(vcardArray)) {
      return null;
    }

    const card = vCard.fromJSON(vcardArray);

    return {
      name: (card.get('fn') as vCard.Property).valueOf(),
      vCard: vcardArray,
    };
  }

  getExpiryDateFromRdapResponse(rdapResponse: RdapResponse): Date | null {
    const expiryEvent = rdapResponse.events.find((event) => {
      return event.eventAction === 'expiration';
    });
    if (isNil(expiryEvent)) {
      return null;
    }
    const eventDate = expiryEvent?.eventDate;
    if (isNil(eventDate)) {
      return null;
    }
    return new Date(eventDate);
  }

  async queryRegistrarInfo(domain: string): Promise<RegistrarInfo | null> {
    const _rdapResponse = await this.queryDomain(domain);
    return this.getRegistrarInfoFromRdapResponse(_rdapResponse);
  }
}

let _instance: IRdapClient | undefined;
let _factory: () => IRdapClient = () => new RdapClient();

/**
 * Lazily resolves the singleton RDAP client. The first call instantiates the
 * configured factory; subsequent calls return the cached instance.
 */
export function getRdapClient(): IRdapClient {
  if (!_instance) {
    _instance = _factory();
  }
  return _instance;
}

/**
 * Override the RDAP client (e.g. for dev or tests). Pass `undefined` to clear.
 */
export function setRdapClient(client: IRdapClient | undefined): void {
  _instance = client;
}

/**
 * Override the factory used to lazily instantiate the default RDAP client.
 * Clears any previously cached instance so the next `getRdapClient()` call
 * uses the new factory.
 */
export function setRdapClientFactory(factory: () => IRdapClient): void {
  _factory = factory;
  _instance = undefined;
}

/**
 * Reset the RDAP client to the default factory and clear any cached instance.
 */
export function resetRdapClient(): void {
  _factory = () => new RdapClient();
  _instance = undefined;
}

/**
 * Backwards-compatible facade. Delegates each call to the lazily-resolved
 * client returned by `getRdapClient()`, so callers picking up a mock via
 * `setRdapClient()` see the override transparently.
 */
export const RDAP: IRdapClient = {
  queryDomain: (domain) => getRdapClient().queryDomain(domain),
  queryDomainStatus: (domain, rdapResponse) =>
    getRdapClient().queryDomainStatus(domain, rdapResponse),
  queryRegistrarInfo: (domain) => getRdapClient().queryRegistrarInfo(domain),
  getLockState: (domain) => getRdapClient().getLockState(domain),
  getRegistrarInfoFromRdapResponse: (rdapResponse) =>
    getRdapClient().getRegistrarInfoFromRdapResponse(rdapResponse),
  getExpiryDateFromRdapResponse: (rdapResponse) =>
    getRdapClient().getExpiryDateFromRdapResponse(rdapResponse),
};
