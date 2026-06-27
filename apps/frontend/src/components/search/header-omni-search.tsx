'use client';

/**
 * HeaderOmniSearch — the app-wide "search everything" bar mounted in the header.
 *
 * Wires the headless OmniSearch (packages/ui) to real frontend data:
 *  - Domains: live availability + suggestions via `useSearch`, inline add-to-cart
 *    via `useCart`.
 *  - Your domains: the signed-in user's owned domains (`users.getCurrentUserDomains`),
 *    deep-linked to their management page.
 *  - Pages & actions: the app's primary navigable destinations.
 *  - Help & resources: the resources Pagefind index (cross-app, same-origin).
 *
 * Lazy-loaded from header.tsx via next/dynamic so this dependency graph stays
 * out of the app-shell bundle.
 */

import {
  type DomainAvailabilityInfo,
  getDomainPricingForOperation,
  isDomainImportable,
} from '@namefi-astra/common/domain-availability';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import { computeChargesInUsdOrThrow } from '@namefi-astra/registrars/data/multi-year-pricing';
import {
  OmniSearch,
  type OmniSearchDomainResult,
  type OmniSearchResult,
  type OmniSearchSection,
} from '@namefi-astra/ui/components/namefi/omni-search';
import type { NamefiNormalizedDomain } from '@namefi-astra/utils/namefi-flavor';
import { useQuery } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useDebounceValue } from 'usehooks-ts';

import { useManageEntrypointViewable } from '@/components/sidebars/use-manage-entrypoint';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useSearch } from '@/hooks/use-search';
import { formatAmountInUSD } from '@/lib/number';
import { useTRPC } from '@/lib/trpc';
import {
  ACCOUNT_DESTINATIONS,
  DOMAIN_ACTIONS,
  destinationMatches,
  flattenNavDestinations,
  MAX_DOMAIN_ACTION_RESULTS,
  tokenizeQuery,
} from './destinations';
import {
  type ResourceHit,
  searchResources,
  toResourcesLanguage,
} from './pagefind-client';

const MAX_OWNED_RESULTS = 5;

/** Pre-format a domain's price (and any first-year-discount original) for display. */
function formatDomainPrice(
  info: DomainAvailabilityInfo,
  operationType: Parameters<typeof getDomainPricingForOperation>[1],
): { priceLabel?: string; originalPriceLabel?: string } {
  try {
    const pricing = getDomainPricingForOperation(info, operationType);
    if (!pricing) return {};
    const priceUsd = computeChargesInUsdOrThrow(pricing, 1);
    const priceLabel = formatAmountInUSD(priceUsd);
    // First-year-discount strikethrough: show renewal as the "original" price
    // when registration is cheaper. Guard it separately so a gap in renewal
    // pricing can't discard the already-resolved registration price.
    const renewal = info.pricingDetails?.renewalPrice;
    if (operationType === itemTypeSchema.enum.REGISTER && renewal) {
      try {
        const renewalUsd = computeChargesInUsdOrThrow(renewal, 1);
        if (priceUsd < renewalUsd) {
          return {
            priceLabel,
            originalPriceLabel: formatAmountInUSD(renewalUsd),
          };
        }
      } catch {
        // Renewal pricing unavailable; fall through to the bare register price.
      }
    }
    return { priceLabel };
  } catch {
    // Pricing not resolvable yet (TLD unsupported / mid-stream); skip price.
    return {};
  }
}

/** Query the resources Pagefind index for the debounced term, in `language`. */
function useResourceResults(
  query: string,
  language: string,
): {
  hits: ResourceHit[];
  loading: boolean;
} {
  const enabled = query.trim().length >= 2;
  const [debounced] = useDebounceValue(query.trim(), 200);
  const [hits, setHits] = useState<ResourceHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Key on the raw `enabled` AND the debounced term: when the query drops
    // below the threshold, `enabled` flips synchronously, which both clears the
    // hits immediately AND runs this effect's cleanup — cancelling any in-flight
    // fetch so a slow earlier response can't repopulate stale rows.
    if (!enabled) {
      setHits([]);
      setLoading(false);
      return;
    }
    // Enabled, but the debounce hasn't caught up to a searchable term yet.
    if (debounced.length < 2) return;
    let cancelled = false;
    setLoading(true);
    searchResources(debounced, language)
      .then((results) => {
        if (!cancelled) setHits(results);
      })
      .catch(() => {
        if (!cancelled) setHits([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, debounced, language]);

  return { hits, loading };
}

export function HeaderOmniSearch() {
  const t = useTranslations('search');
  const tNav = useTranslations('nav');
  const router = useRouter();

  const search = useSearch();
  const cart = useCart();
  const { isAuthenticated } = useAuth();
  // Mirror the sidebar's extra gate on the bulk Manage entrypoint so search and
  // nav never disagree about whether `/manage` is reachable for this user.
  const showManageEntrypoint = useManageEntrypointViewable();
  const trpc = useTRPC();
  const locale = useLocale();
  const resourcesLanguage = useMemo(
    () => toResourcesLanguage(locale),
    [locale],
  );
  const resources = useResourceResults(search.query, resourcesLanguage);

  const { data: ownedDomains } = useQuery({
    ...trpc.users.getCurrentUserDomains.queryOptions(void 0, {
      placeholderData: (prev) => prev,
    }),
    enabled: isAuthenticated,
  });

  const query = search.query;
  const normalizedQuery = query.trim().toLowerCase();

  /** Compute the inline add-to-cart button state for a domain. */
  const domainCartState = (
    domain: NamefiNormalizedDomain,
    importable: boolean,
    available: boolean,
    claimEligible: boolean,
  ): OmniSearchDomainResult['cartState'] => {
    const inCart = cart.isDomainInCart(domain);
    const busy = cart.isDomainBusy(domain);
    // Cart membership/busy take precedence so an already-carted domain stays
    // removable from the header even when it is also free-claim eligible.
    if (inCart && busy) return 'removing';
    if (inCart) return 'in-cart';
    if (busy) return 'adding';
    // 'claim' routes to the free-claim flow (see handleAddToCart) and renders a
    // "Free Claim" button, so the label matches the action.
    if (claimEligible) return 'claim';
    // Availability wins: an available domain registers (`add`); `import` is only
    // for taken-but-transferable domains.
    return importable && !available ? 'import' : 'add';
  };

  /** Short status shown on a taken domain; undefined while loading or available. */
  const domainStatusLabel = (
    info: DomainAvailabilityInfo | undefined,
    available: boolean,
    importable: boolean,
  ): string | undefined => {
    if (!info || available) return undefined;
    return importable ? t('omniSearch.importable') : t('omniSearch.taken');
  };

  const domainResults: OmniSearchResult[] = search.domains.map((domain) => {
    const info = search.domainInfos.get(domain);
    const importable = info ? isDomainImportable(info) : false;
    const available = info?.availability ?? false;
    const claimEligible = !!search.freeClaimEligibility?.find(
      (entry) => entry.domain === domain,
    )?.eligible;
    const operationType = importable
      ? itemTypeSchema.enum.IMPORT
      : itemTypeSchema.enum.REGISTER;
    // Free-claim domains are claimed for free, so suppress the register price.
    const { priceLabel, originalPriceLabel } =
      info && !claimEligible ? formatDomainPrice(info, operationType) : {};
    const cartState = domainCartState(
      domain,
      importable,
      available,
      claimEligible,
    );
    return {
      kind: 'domain',
      id: `domain:${domain}`,
      domain,
      available,
      importable,
      isPremium: info?.isPremium ?? false,
      priceLabel,
      originalPriceLabel,
      statusLabel: domainStatusLabel(info, available, importable),
      cartState,
    } satisfies OmniSearchDomainResult;
  });

  // Gate on `isAuthenticated`: `placeholderData` keeps the last response cached
  // after the query disables on sign-out, so without this guard a prior user's
  // domains would linger in the results until a hard reload.
  const ownedResults: OmniSearchResult[] = (
    isAuthenticated ? (ownedDomains ?? []) : []
  )
    .filter((d) => {
      // Match the registrable label (before the TLD), not the whole string, so a
      // TLD-token query like "com" doesn't dump every owned .com into the group.
      const name = d.normalizedDomainName;
      const label = name.split('.')[0] ?? name;
      return (
        label.includes(normalizedQuery) || name.startsWith(normalizedQuery)
      );
    })
    .slice(0, MAX_OWNED_RESULTS)
    .map((d) => ({
      kind: 'destination',
      id: `owned:${d.normalizedDomainName}`,
      title: d.normalizedDomainName,
      href: `/domains/${d.normalizedDomainName}`,
      badgeLabel: t('omniSearch.ownedBadge'),
      icon: <Globe className="size-4 opacity-60" />,
    }));

  // Resolve dynamic i18n keys with the same cast the sidebar uses
  // (sidebar-items.tsx): nav titles live under `nav.items.*`, catalog titles
  // under `search.omniSearch.{destinations,domainActions}.*`. The i18n coverage
  // checker still counts them via its dynamic-namespace / template-glob rules.
  const tNavDynamic = tNav as (key: string) => string;
  const tDynamic = t as (key: string) => string;

  // Top-level pages from the shared sidebar nav registry (the single source the
  // sidebar renders), flattened and auth-gated like the nav itself.
  const navDestinationResults: OmniSearchResult[] = flattenNavDestinations()
    .filter((item) => isAuthenticated || !item.requiresAuth)
    // `items.manage` carries a backend viewable gate beyond auth (see the
    // shared hook); hide it from search when the sidebar would also hide it.
    .filter((item) => item.title !== 'items.manage' || showManageEntrypoint)
    .map((item) => ({ item, title: tNavDynamic(item.title) }))
    .filter(({ item, title }) =>
      destinationMatches(query, title, item.keywords),
    )
    .map(({ item, title }) => {
      const Icon = item.icon;
      return {
        kind: 'destination',
        id: `nav:${item.href}`,
        title,
        href: item.href,
        icon: Icon ? <Icon className="size-4 opacity-60" /> : undefined,
        badgeLabel: t('omniSearch.pageBadge'),
      } satisfies OmniSearchResult;
    });

  // Account pages + quick actions that have no sidebar entry (API key, top-up,
  // profile sub-tabs). Hidden when signed out since every entry requires auth.
  const accountDestinationResults: OmniSearchResult[] =
    ACCOUNT_DESTINATIONS.filter((dest) => isAuthenticated || !dest.requiresAuth)
      .map((dest) => ({
        dest,
        title: tDynamic(`omniSearch.destinations.${dest.titleKey}`),
      }))
      .filter(({ dest, title }) =>
        destinationMatches(query, title, dest.keywords),
      )
      .map(({ dest, title }) => {
        const Icon = dest.icon;
        return {
          kind: 'destination',
          id: `acct:${dest.id}`,
          title,
          href: dest.href,
          icon: <Icon className="size-4 opacity-60" />,
          badgeLabel:
            dest.badge === 'action'
              ? t('omniSearch.actionBadge')
              : t('omniSearch.pageBadge'),
        } satisfies OmniSearchResult;
      });

  const destinationResults: OmniSearchResult[] = [
    ...navDestinationResults,
    ...accountDestinationResults,
  ];

  // Per-domain management deep-links: when the query matches a management action
  // (e.g. "dnssec", "dns records", "sell"), surface that action for the user's
  // owned domains, narrowed by any non-action token (so "dnssec acme" prefers
  // acme.*). Bounded by MAX_DOMAIN_ACTION_RESULTS to keep the panel scannable.
  const ownedForActions = isAuthenticated ? (ownedDomains ?? []) : [];
  const matchedDomainActions =
    ownedForActions.length === 0
      ? []
      : DOMAIN_ACTIONS.filter((action) =>
          destinationMatches(
            query,
            tDynamic(`omniSearch.domainActions.${action.titleKey}`),
            action.keywords,
          ),
        );
  const domainActionResults: OmniSearchResult[] = [];
  if (matchedDomainActions.length > 0) {
    const actionTerms = new Set(
      DOMAIN_ACTIONS.flatMap((action) => action.keywords ?? []).map((keyword) =>
        keyword.toLowerCase(),
      ),
    );
    const nameTokens = tokenizeQuery(normalizedQuery).filter(
      (tok) => !actionTerms.has(tok),
    );
    const targetDomains = ownedForActions.filter((domain) => {
      const name = domain.normalizedDomainName.toLowerCase();
      return (
        nameTokens.length === 0 || nameTokens.some((tok) => name.includes(tok))
      );
    });
    for (const action of matchedDomainActions) {
      if (domainActionResults.length >= MAX_DOMAIN_ACTION_RESULTS) break;
      const Icon = action.icon;
      const title = tDynamic(`omniSearch.domainActions.${action.titleKey}`);
      for (const domain of targetDomains) {
        if (domainActionResults.length >= MAX_DOMAIN_ACTION_RESULTS) break;
        const name = domain.normalizedDomainName;
        const href = action.tab
          ? `/domains/${name}?tab=${action.tab}`
          : `/domains/${name}`;
        domainActionResults.push({
          kind: 'destination',
          id: `domain-action:${action.id}:${name}`,
          title,
          subtitle: name,
          href,
          icon: <Icon className="size-4 opacity-60" />,
          badgeLabel: t('omniSearch.actionBadge'),
        });
      }
    }
  }

  const resourceResults: OmniSearchResult[] = resources.hits.map((hit) => ({
    kind: 'resource',
    id: hit.id,
    title: hit.title,
    href: hit.href,
    subtitleHtml: hit.excerptHtml,
    // No badge: the Pagefind collection name (blog/tld/glossary…) is raw English
    // with no translation key, and the "Help & resources" group heading already
    // categorizes these rows.
  }));

  const sections: OmniSearchSection[] =
    normalizedQuery.length === 0
      ? []
      : [
          {
            id: 'domains',
            heading: t('omniSearch.groups.domains'),
            results: domainResults,
            loading: search.isLoading && domainResults.length === 0,
            footer: {
              id: 'all',
              label: t('omniSearch.seeAll', { query: query.trim() }),
              onSelect: () =>
                router.push(`/?query=${encodeURIComponent(query.trim())}`),
            },
          },
          ...(ownedResults.length > 0
            ? [
                {
                  id: 'owned',
                  heading: t('omniSearch.groups.ownedDomains'),
                  results: ownedResults,
                },
              ]
            : []),
          ...(destinationResults.length > 0
            ? [
                {
                  id: 'destinations',
                  heading: t('omniSearch.groups.destinations'),
                  results: destinationResults,
                },
              ]
            : []),
          ...(domainActionResults.length > 0
            ? [
                {
                  id: 'domainActions',
                  heading: t('omniSearch.groups.domainActions'),
                  results: domainActionResults,
                },
              ]
            : []),
          {
            id: 'resources',
            heading: t('omniSearch.groups.resources'),
            results: resourceResults,
            loading: resources.loading && resourceResults.length === 0,
          },
        ];

  const handleSelect = (result: OmniSearchResult) => {
    if (result.kind === 'domain') {
      router.push(`/?query=${encodeURIComponent(result.domain)}`);
      return;
    }
    router.push(result.href as Route);
  };

  const handleAddToCart = (result: OmniSearchDomainResult) => {
    // Free-claim routing only needs the domain name, so check it BEFORE the
    // availability-info guard — the row can show a "Free Claim" action from
    // `freeClaimEligibility` before `domainInfos` has loaded, and the click
    // must work then. Routing to /claim avoids charging for a free domain.
    const claim = search.freeClaimEligibility?.find(
      (entry) => entry.domain === result.domain,
    );
    if (claim?.eligible) {
      router.push(`/claim/${encodeURIComponent(result.domain)}` as Route);
      return;
    }
    const info = search.domainInfos.get(
      result.domain as NamefiNormalizedDomain,
    );
    if (!info) return;
    // Imports require an EPP code (collected in the full search UI), so route
    // there instead of adding an incomplete import item from the header.
    if (!info.availability && isDomainImportable(info)) {
      router.push(`/?query=${encodeURIComponent(result.domain)}`);
      return;
    }
    const minDuration = Math.max(1, info.durationValidationInYears?.min ?? 1);
    void cart.addItem({
      domainAvailabilityInfo: info,
      durationInYears: minDuration,
      operationType: itemTypeSchema.enum.REGISTER,
    });
  };

  const handleRemoveFromCart = (result: OmniSearchDomainResult) => {
    void cart.removeItem(result.domain as NamefiNormalizedDomain);
  };

  return (
    <OmniSearch
      query={query}
      onQueryChange={search.setQuery}
      sections={sections}
      surface="auto"
      data-testid="search.omniSearch"
      labels={{
        placeholder: t('omniSearch.placeholder'),
        empty: t('omniSearch.empty'),
        premium: t('omniSearch.premium'),
        all: t('omniSearch.all'),
        cart: {
          add: t('omniSearch.cart.add'),
          adding: t('omniSearch.cart.adding'),
          inCart: t('omniSearch.cart.inCart'),
          removing: t('omniSearch.cart.removing'),
          import: t('omniSearch.cart.import'),
          // Reuse the existing, already-translated free-claim CTA.
          claim: t('card.freeClaim'),
        },
      }}
      onSelect={handleSelect}
      onAddToCart={handleAddToCart}
      onRemoveFromCart={handleRemoveFromCart}
    />
  );
}
