import { headers } from 'next/headers';
import { cache } from 'react';
import { resolveTrustedParkHost } from './indexing-policy';
import { getDomainQueryParam } from './request';

export const getOriginRuntime = cache(async () => {
  const headerList = await headers();
  const host = resolveTrustedParkHost({
    host: headerList.get('host'),
    originalHost: headerList.get('x-original-host'),
  });
  const domainOverride = getDomainQueryParam(headerList);

  return {
    host,
    domainOverride,
  };
});

export type OriginRuntime = Awaited<ReturnType<typeof getOriginRuntime>>;
