import { getHostname } from '@/lib/string';
import { originConfig } from './config';
import {
  getDomainForPoweredByNamefiThirdPartyOrigin,
  isNamefiFirstPartyOrigin,
} from './utils';
import type { OriginConfig, OriginInfo } from './types';

function getOriginConfig(origin: string | null): OriginConfig {
  if (!origin) {
    return originConfig.firstParty;
  }

  const thirdPartyDomain = getDomainForPoweredByNamefiThirdPartyOrigin(origin);
  if (thirdPartyDomain && originConfig.thirdParty[thirdPartyDomain]) {
    return originConfig.thirdParty[thirdPartyDomain];
  }

  return originConfig.firstParty;
}

export const getOriginInfo = (origin: string): OriginInfo => {
  const isFirstPartyOrigin = isNamefiFirstPartyOrigin(origin);
  const hostname = getHostname(origin);
  const thirdPartyHostname = isFirstPartyOrigin
    ? null
    : getDomainForPoweredByNamefiThirdPartyOrigin(origin) || hostname;

  return {
    isFirstPartyOrigin,
    thirdPartyHostname,
    config: getOriginConfig(origin),
  };
};
