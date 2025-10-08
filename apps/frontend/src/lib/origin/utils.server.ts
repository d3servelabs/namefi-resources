import { originConfig } from './config';
import type { OriginInfo } from './types';
import { headers } from 'next/headers';
import { cache } from 'react';
import { getOriginFromServerHeaders, getOriginInfo } from './utils';

export const getOriginRuntime = cache(async () => {
  const headersList = await headers();
  const origin = getOriginFromServerHeaders(headersList);
  const info: OriginInfo = origin
    ? getOriginInfo(origin)
    : {
        isFirstPartyOrigin: true,
        thirdPartyHostname: null,
        config: originConfig.firstParty,
      };
  return {
    origin,
    ...info,
  };
});

export type OriginRuntime = Awaited<ReturnType<typeof getOriginRuntime>>;
