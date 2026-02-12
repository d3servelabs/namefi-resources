import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { config } from '@/lib/env';
import { POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES } from '@/lib/env/consts';

/**
 * @deprecated This utility is no longer the preferred approach for email redirects.
 * The `/m/*` routes now use Next.js Middleware (see `src/middleware.ts`) which handles
 * redirects at the edge before any page rendering occurs, providing better performance.
 *
 * This file is kept for backwards compatibility or special use cases, but new redirect
 * routes should be added to the middleware instead.
 */

const isPoweredByNamefiDomains = (domain: string) => {
  return POWERED_BY_NAMEFI_THIRD_PARTY_HOSTNAMES.includes(domain);
};

export type ResolvePathFunction = (args: {
  redirectHostname: string;
  originalPath: string;
  originalSearchParams: URLSearchParams;
  pathParams: Record<string, string | string[] | undefined>;
}) => string;

/**
 * @deprecated Use middleware instead for better performance (see `src/middleware.ts`).
 *
 * Redirects to the correct hostname based on the poweredByNamefi domain (if it's passed in the query params).
 * This is designed for App Router Server Components.
 * @param resolvePath - A function that resolves the final redirect path.
 * @param searchParams - The search params object from the page props.
 * @param pathParams - The params object from the page props (for dynamic routes).
 */
export async function poweredByNamefiRedirect(
  resolvePath: ResolvePathFunction,
  searchParams: Record<string, string | string[] | undefined>,
  pathParams: Record<string, string | string[] | undefined> = {},
): Promise<never> {
  const headersList = await headers();
  const host = headersList.get('host');

  if (!host) {
    redirect('https://namefi.io');
  }

  // Get the current pathname from the referer or construct it
  const referer = headersList.get('referer');
  let pathname = '/';

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      pathname = refererUrl.pathname;
    } catch {
      // If referer parsing fails, use default
      pathname = '/';
    }
  }

  let redirectHostname = new URL(config.FIRST_PARTY_DEPLOYMENT_URL).host;
  const maybePoweredByNamefiDomain =
    typeof searchParams['powered-by-namefi'] === 'string'
      ? searchParams['powered-by-namefi']
      : undefined;

  if (
    maybePoweredByNamefiDomain &&
    isPoweredByNamefiDomains(maybePoweredByNamefiDomain)
  ) {
    redirectHostname = maybePoweredByNamefiDomain;
  }

  // Create new search params without the powered-by-namefi parameter
  const newUrlSearchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== 'powered-by-namefi' && value !== undefined) {
      if (Array.isArray(value)) {
        for (const v of value) {
          newUrlSearchParams.append(key, v);
        }
      } else {
        newUrlSearchParams.append(key, value);
      }
    }
  }

  const _destination = resolvePath({
    redirectHostname,
    originalPath: pathname,
    originalSearchParams: newUrlSearchParams,
    pathParams,
  });
  const destination =
    new URL(_destination).hostname === 'localhost'
      ? _destination.replace('https://', 'http://')
      : _destination;

  redirect(destination);
}
