import { mapObjIndexed } from 'ramda';
import { addPoweredByNamefiToUrl } from './components/powered-by-namefi-url-context';

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
  dashboard: () => 'https://namefi.io/m/user/domains',
  domains: () => 'https://namefi.io/m/user/domains',
  domainSettings: (args: { domain: string }) =>
    `https://namefi.io/m/user/domains/${encodeURIComponent(args.domain)}`,
  ordersHistory: () => 'https://namefi.io/m/user/orders',
  orderDetails: (args: { orderId: string }) =>
    `https://namefi.io/m/user/orders/${args.orderId}`,
  paymentMethods: () => 'https://namefi.io/m/user/payment-methods',
  emailSubscription: () => 'https://namefi.io/m/user/email/subscription',
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
