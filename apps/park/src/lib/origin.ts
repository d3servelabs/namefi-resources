import { headers } from 'next/headers';
import { cache } from 'react';
import { getDomainQueryParam } from './request';

export const getOriginRuntime = cache(async () => {
  const headerList = await headers();
  const host =
    headerList.get('x-original-host') ?? headerList.get('host') ?? null;
  const domainOverride = getDomainQueryParam(headerList);

  return {
    host,
    domainOverride,
  };
});

export type OriginRuntime = Awaited<ReturnType<typeof getOriginRuntime>>;
