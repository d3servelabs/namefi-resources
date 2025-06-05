import axios from 'axios';
import { isNil } from 'ramda';
import vCard from 'vcf';
import type { GetLockStateResponse } from './get-lock-state-response';
import type { RdapDomainStatus, RdapResponse } from './rdap-response';

async function queryDomain(domain: string): Promise<RdapResponse> {
  console.log('[RDAP] queryDomain', domain);
  try {
    const res = await axios.get(`https://rdap.org/domain/${domain}`, {
      timeout: 5000,
    });
    return res.data;
  } catch (error) {
    console.error('[RDAP] queryDomain', domain, error);
    throw error;
  }
}

async function queryDomainStatus(
  domain: string,
  rdapResponse?: RdapResponse,
): Promise<{ status: RdapDomainStatus[] }> {
  const _rdapResponse = rdapResponse ?? (await queryDomain(domain));
  return {
    status: _rdapResponse.status,
  };
}

async function getLockState(domain: string): Promise<GetLockStateResponse> {
  const { status } = await queryDomainStatus(domain);
  const prohibitedRegex = new RegExp(/(transfer|update) prohibited/g);

  let prohibited = false;
  let isAddPeriod = false;
  let isTransferPeriod = false;
  // biome-ignore lint/suspicious/noExplicitAny:
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

function getRegistrarInfoFromRdapResponse(
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

function getExpiryDateFromRdapResponse(
  rdapResponse: RdapResponse,
): Date | null {
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

async function queryRegistrarInfo(
  domain: string,
): Promise<RegistrarInfo | null> {
  const _rdapResponse = await queryDomain(domain);
  return getRegistrarInfoFromRdapResponse(_rdapResponse);
}

// biome-ignore lint/suspicious/noExplicitAny:
export type RegistrarInfo = { name: string; vCard?: any };

export const RDAP = {
  queryDomain,
  queryDomainStatus,
  queryRegistrarInfo,
  getLockState,
  getRegistrarInfoFromRdapResponse,
  getExpiryDateFromRdapResponse,
};
