import { matchAny } from '@namefi-astra/utils/match';
import axios from 'axios';
import type { GetLockStateResponse } from './get-lock-state-response';

async function queryDomain(domain: string): Promise<WhoisJsonApi['WhoisData']> {
  const res = await axios.get(
    `https://whoisjsonapi.com/v1/${domain}?apiKey=${process.env.WHOIS_API_KEY}`,
    {
      timeout: 5000,
    },
  );
  return res.data;
}

async function queryDomainStatus(
  domain: string,
  whoisData?: WhoisJsonApi['WhoisData'],
) {
  const _whoisData = whoisData ?? (await queryDomain(domain));

  return {
    status: _whoisData.domain.status,
  };
}

async function getLockState(domain: string): Promise<GetLockStateResponse> {
  const { status } = await queryDomainStatus(domain);
  const statusArray = status;
  const prohibited = statusArray.some((value) =>
    matchAny(
      value,
      'serverTransferProhibited',
      'serverUpdateProhibited',
      'clientTransferProhibited',
      'clientUpdateProhibited',
    ),
  );
  const isAddPeriod = statusArray.includes('addPeriod');
  const isTransferPeriod = statusArray.includes('transferPeriod');

  return {
    locked: prohibited,
    // biome-ignore lint/suspicious/noExplicitAny:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    status: statusArray as any, //todo convert them to rdap
    isAddPeriod,
    isTransferPeriod,
  };
}

function getRegistrarInfoFromWhoisResponse(
  whoisData: WhoisJsonApi['WhoisData'],
) {
  return whoisData.registrar;
}

function getExpiryDateFromWhoisResponse(
  whoisData: WhoisJsonApi['WhoisData'],
): Date {
  return new Date(whoisData.domain.expiration_date_in_time);
}

export const WhoisClient = {
  queryDomain,
  queryDomainStatus,
  getLockState,
  getRegistrarInfoFromWhoisResponse,
  getExpiryDateFromWhoisResponse,
};

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
