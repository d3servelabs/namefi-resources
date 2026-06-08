import type { Route } from 'next';

export function getLeadgenStartHref(domainName: string): Route {
  return `/outbound?domain=${encodeURIComponent(domainName)}` as Route;
}
