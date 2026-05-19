import { originConfig as astraConfig } from '@/pbns/astra/config';
import { getHostname } from '@/lib/string';
import { isThirdPartyOriginKey, type ThirdPartyOriginKey } from './keys';
import type { OriginConfig, OriginInfo } from './types';
import { headers } from 'next/headers';
import { cache } from 'react';
import {
  getDomainForPoweredByNamefiThirdPartyOrigin,
  getOriginFromServerHeaders,
  isNamefiFirstPartyOrigin,
} from './utils';

const thirdPartyOriginConfigLoaders = {
  aave: () => import('@/pbns/aave/config').then((mod) => mod.originConfig),
  uniswap: () =>
    import('@/pbns/uniswap/config').then((mod) => mod.originConfig),
  '0x.city': () =>
    import('@/pbns/0x-city/config').then((mod) => mod.originConfig),
  'token.com': () =>
    import('@/pbns/token-com/config').then((mod) => mod.originConfig),
  'taylor.cv': () =>
    import('@/pbns/cv/names/taylor').then((mod) => mod.originConfig),
  'ali.cv': () => import('@/pbns/cv/names/ali').then((mod) => mod.originConfig),
  'li.cv': () => import('@/pbns/cv/names/li').then((mod) => mod.originConfig),
  'muller.cv': () =>
    import('@/pbns/cv/names/muller').then((mod) => mod.originConfig),
  'kumar.cv': () =>
    import('@/pbns/cv/names/kumar').then((mod) => mod.originConfig),
  'victor.cv': () =>
    import('@/pbns/cv/names/victor').then((mod) => mod.originConfig),
  'starts.today': () =>
    import('@/pbns/bespoke/domains/starts-today').then(
      (mod) => mod.originConfig,
    ),
  'ends.today': () =>
    import('@/pbns/bespoke/domains/ends-today').then((mod) => mod.originConfig),
  'promos.today': () =>
    import('@/pbns/bespoke/domains/promos-today').then(
      (mod) => mod.originConfig,
    ),
  'available.today': () =>
    import('@/pbns/bespoke/domains/available-today').then(
      (mod) => mod.originConfig,
    ),
  'discounts.today': () =>
    import('@/pbns/bespoke/domains/discounts-today').then(
      (mod) => mod.originConfig,
    ),
} satisfies Record<ThirdPartyOriginKey, () => Promise<OriginConfig>>;

async function getThirdPartyOriginConfig(hostname: string) {
  if (!isThirdPartyOriginKey(hostname)) {
    return null;
  }

  return thirdPartyOriginConfigLoaders[hostname]();
}

export const getOriginRuntime = cache(async () => {
  const headersList = await headers();
  const origin = getOriginFromServerHeaders(headersList);

  if (!origin) {
    return {
      origin,
      isFirstPartyOrigin: true,
      thirdPartyHostname: null,
      config: astraConfig,
    };
  }

  const isFirstPartyOrigin = isNamefiFirstPartyOrigin(origin);
  const hostname = getHostname(origin);
  const processedHostname = isFirstPartyOrigin
    ? hostname
    : getDomainForPoweredByNamefiThirdPartyOrigin(origin) || hostname;
  const thirdPartyHostname = isFirstPartyOrigin ? null : processedHostname;
  const thirdPartyConfig = isFirstPartyOrigin
    ? null
    : await getThirdPartyOriginConfig(processedHostname);

  const info: OriginInfo = {
    isFirstPartyOrigin,
    thirdPartyHostname,
    config: thirdPartyConfig ?? astraConfig,
  };

  return {
    origin,
    ...info,
  };
});

export type OriginRuntime = Awaited<ReturnType<typeof getOriginRuntime>>;
