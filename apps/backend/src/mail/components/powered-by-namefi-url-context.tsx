import React from 'react';

/**
 * Context type for managing powered by Namefi domain information.
 */
type PoweredByNamefiUrlContextType = {
  /** The domain that is being powered by Namefi, or null if not applicable */
  poweredByNamefiDomain: string | null;
};

/**
 * React context for sharing powered by Namefi domain information throughout the component tree.
 * Used to pass domain information to email components that need to generate URLs with proper tracking.
 */
export const PoweredByNamefiUrlContext =
  React.createContext<PoweredByNamefiUrlContextType>({
    poweredByNamefiDomain: null,
  });

/**
 * Provider component that supplies powered by Namefi domain context to child components.
 *
 * @param props - The component props
 * @param props.poweredByNamefiDomain - The domain being powered by Namefi, or null if not applicable
 * @param props.children - Child components that will have access to the context
 *
 * @example
 * ```tsx
 * <PoweredByNamefiDomainProvider poweredByNamefiDomain="example.com">
 *   <EmailTemplate />
 * </PoweredByNamefiDomainProvider>
 * ```
 */
export function PoweredByNamefiDomainProvider(props: {
  poweredByNamefiDomain: string | null;
  children?: React.ReactNode;
}) {
  return (
    <PoweredByNamefiUrlContext.Provider
      value={{ poweredByNamefiDomain: props.poweredByNamefiDomain }}
    >
      {props.children}
    </PoweredByNamefiUrlContext.Provider>
  );
}

/**
 * Hook to access the powered by Namefi domain from context or use a provided override.
 *
 * @param poweredByNamefiDomain - Optional override for the domain. If provided, takes precedence over context value
 * @returns The powered by Namefi domain string, or null if not available
 *
 * @example
 * ```tsx
 * function EmailComponent() {
 *   const domain = usePoweredByNamefiDomain();
 *   // Use domain in email generation...
 * }
 * ```
 */
export function usePoweredByNamefiDomain(
  poweredByNamefiDomain?: string | null,
) {
  const context = React.useContext(PoweredByNamefiUrlContext);
  if (!context) {
    return poweredByNamefiDomain ?? null;
  }
  return poweredByNamefiDomain ?? context.poweredByNamefiDomain;
}

/**
 * Adds powered by Namefi tracking parameters to a URL for email link tracking.
 * Automatically adds utm_source=email and powered-by-namefi domain parameters.
 *
 * @param url - The base URL to modify
 * @param poweredByNamefiDomain - The domain being powered by Namefi. If null, returns original URL unchanged
 * @param extraSearchParams - Additional search parameters to add to the URL
 * @returns The modified URL with tracking parameters, or original URL if no domain provided
 *
 * @example
 * ```tsx
 * const trackedUrl = addPoweredByNamefiToUrl(
 *   'https://namefi.io/domains',
 *   'example.com',
 *   { campaign: 'renewal' }
 * );
 * // Returns: https://namefi.io/domains?utm_source=email&powered-by-namefi=example.com&campaign=renewal
 * ```
 */
export function addPoweredByNamefiToUrl(
  url: string,
  poweredByNamefiDomain: string | null,
  extraSearchParams?: Record<string, string>,
) {
  if (!poweredByNamefiDomain) {
    return url;
  }

  return addSearchParamsToUrl(url, {
    ...(extraSearchParams ?? {}),
    utm_source: 'email',
    'powered-by-namefi': poweredByNamefiDomain,
  });
}

/**
 * Utility function to add search parameters to a URL.
 *
 * @param url - The base URL to modify
 * @param searchParams - Object containing key-value pairs to add as search parameters
 * @returns The modified URL with added search parameters
 *
 * @example
 * ```tsx
 * const newUrl = addSearchParamsToUrl('https://example.com?a=b', {
 *   foo: 'bar',
 *   baz: 'qux'
 * });
 * // Returns: https://example.com?a=b&foo=bar&baz=qux
 * ```
 */
export function addSearchParamsToUrl(
  url: string,
  searchParams: Record<string, string>,
) {
  const newUrl = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    newUrl.searchParams.set(key, value);
  });
  return newUrl.toString();
}

/**
 * Consumer component that provides access to the powered by Namefi domain via render prop pattern.
 *
 * @param props - The component props
 * @param props.children - Render function that receives the powered by Namefi domain
 *
 * @example
 * ```tsx
 * <PoweredByNamefiDomainConsumer>
 *   {(domain) => (
 *     <a href={addPoweredByNamefiToUrl('/manage', domain)}>
 *       Manage Domain
 *     </a>
 *   )}
 * </PoweredByNamefiDomainConsumer>
 * ```
 */
export function PoweredByNamefiDomainConsumer(props: {
  children: (poweredByNamefiDomain: string | null) => React.ReactNode;
}) {
  const poweredByNamefiDomain = usePoweredByNamefiDomain();
  return props.children(poweredByNamefiDomain);
}

/**
 * Higher-order component that provides the powered by Namefi domain to the component.
 *
 * @param Component - The component to wrap
 * @returns The wrapped component
 */
export function withPoweredByNamefiDomain<T>(
  Component: React.ComponentType<T>,
): React.ComponentType<T & { poweredByNamefiDomain?: string | null }> {
  function WrappedComponent(
    props: T & { poweredByNamefiDomain?: string | null },
  ) {
    return (
      <PoweredByNamefiDomainProvider
        poweredByNamefiDomain={props.poweredByNamefiDomain ?? null}
      >
        <Component {...props} />
      </PoweredByNamefiDomainProvider>
    );
  }
  WrappedComponent.displayName = `withPoweredByNamefiDomain(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}
