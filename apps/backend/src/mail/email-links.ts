import { mapObjIndexed } from 'ramda';
import { addPoweredByNamefiToUrl } from './components/powered-by-namefi-url-context';
import { mailConfig } from './env';

/**
 * `custom` and `preview` intentionally fall back to production.
 * They are runtime-hosted environments where email links should always resolve
 * to the canonical production domain.
 */
export const baseUrlByEnvironment: Record<
  (typeof mailConfig)['ENVIRONMENT'],
  string
> = {
  production: 'https://namefi.io',
  development: 'https://namefi.dev',
  local: 'http://localhost:5050',
  test: 'http://localhost:5050',
  custom: 'https://namefi.io',
  preview: 'https://namefi.io',
};

export function getBaseUrlForEnvironment(
  environment: (typeof mailConfig)['ENVIRONMENT'],
) {
  return baseUrlByEnvironment[environment];
}

const baseUrl = getBaseUrlForEnvironment(mailConfig.ENVIRONMENT);

/**
 * A record of functions that return urls with the powered by namefi domain added
 *
 * @example
 * ```tsx
 * <a href={NamefiEmailLinks.dashboard()}>Dashboard</a>
 * <a href={NamefiEmailLinks.dashboard({ extraSearchParams: { utm_source: 'email' } })}>Dashboard</a>
 * ```
 */
export const NamefiEmailLinks = withPoweredByNamefiDomain({
  home: () => `${baseUrl}`,
  dashboard: () => `${baseUrl}/m/user/domains`,
  domains: () => `${baseUrl}/m/user/domains`,
  domainSettings: (args: { domain: string }) =>
    `${baseUrl}/m/user/domains/${encodeURIComponent(args.domain)}`,
  claimDomain: (args: { domain: string }) =>
    `${baseUrl}/claim/${encodeURIComponent(args.domain)}`,
  ordersHistory: () => `${baseUrl}/m/user/orders`,
  orderDetails: (args: { orderId: string }) =>
    `${baseUrl}/m/user/orders/${args.orderId}`,

  paymentMethods: () => `${baseUrl}/m/user/payment-methods`,
  rechargeNFSC: () => `${baseUrl}/m/user/nfsc/recharge`,
  cart: () => `${baseUrl}/m/cart`,
  addToCartFromUrl: (args: { domain: string }) =>
    `${baseUrl}/m/cart?add_to_cart=${encodeURIComponent(args.domain)}`,
  leadgenRun: (args: { runId: string }) =>
    `${baseUrl}/leadgen/${encodeURIComponent(args.runId)}`,

  emailSubscription: () => `${baseUrl}/m/user/email/subscription`,
  freeMints: () => `${baseUrl}/m/user/rewards/domains`,
} as const);

/**
 * A Higher Order Function that takes a record of functions and returns a new record of functions that add the powered by namefi domain to the url
 *
 * Add the powered by namefi domain to the url
 *
 * @param value - The url to add the powered by namefi domain to
 * @returns The url with the powered by namefi domain added
 */
function withPoweredByNamefiDomain<
  T extends Record<string, (args: any) => string>,
>(value: T) {
  return mapObjIndexed((value) => {
    return (args: NamefiEmailLinksArgs) => {
      return addPoweredByNamefiToUrl(
        value(args),
        args.poweredByNamefiDomain,
        args.extraSearchParams,
      );
    };
  }, value) as { [K in keyof T]: WithPoweredByNamefiDomainFunction<T[K]> };
}

export type NamefiEmailLinksArgs<T extends object = object> = {
  poweredByNamefiDomain: string | null;
  extraSearchParams?: Record<string, string>;
} & T;

type WithPoweredByNamefiDomainFunction<T extends (args: any) => string> =
  T extends (args: infer R) => string
    ? R extends object
      ? (args: NamefiEmailLinksArgs<R>) => string
      : (args: NamefiEmailLinksArgs) => string
    : never;
