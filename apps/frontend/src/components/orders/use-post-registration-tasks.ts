'use client';

import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTRPC } from '@/lib/trpc';
import type { PostRegistrationTask } from './post-registration-tasks';

const POLL_MS = 8000;

/**
 * Wires the order completion page's after-registration panel to live status.
 * Only two steps happen *after* registration, and they run **in parallel**:
 *   - Minting NFT → registry.getDomainsByOwner (domain present with a tokenId)
 *   - DNSSEC      → domainConfig.dnssec.getActiveDnssecOperationWorkflows
 *
 * (DNS propagation + parking are part of the registration phase, not here.)
 */
export function usePostRegistrationTasks({
  domains,
  walletAddress,
  enabled,
}: {
  domains: string[];
  walletAddress: string | null;
  enabled: boolean;
}): {
  tasks: PostRegistrationTask[];
  mintedByName: Map<string, string>;
  allDone: boolean;
} {
  const trpc = useTRPC();
  const total = domains.length;
  const active = enabled && total > 0;

  // Mint + index — the domain shows up owned by the recipient with a tokenId.
  const ownedQuery = useQuery(
    trpc.registry.getDomainsByOwner.queryOptions(
      { identifier: walletAddress ?? '' },
      {
        enabled: active && Boolean(walletAddress),
        refetchInterval: (query) => {
          // Mint completion is tokenization, so only stop polling once each
          // domain appears with a non-null tokenId — not on name presence.
          const mintedNames = new Set(
            (query.state.data?.domains ?? [])
              .filter((d) => d.tokenId)
              .map((d) => String(d.normalizedDomainName)),
          );
          return domains.every((d) => mintedNames.has(d)) ? false : POLL_MS;
        },
      },
    ),
  );
  const mintedByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of ownedQuery.data?.domains ?? []) {
      if (d.tokenId) map.set(String(d.normalizedDomainName), d.tokenId);
    }
    return map;
  }, [ownedQuery.data]);
  const mintedCount = domains.filter((d) => mintedByName.has(d)).length;
  const allMinted = total > 0 && mintedCount >= total;

  // DNSSEC — per-domain active-workflow check (only meaningful once minted).
  const dnssecQueries = useQueries({
    queries: domains.map((domainName) => ({
      ...trpc.domainConfig.dnssec.getActiveDnssecOperationWorkflows.queryOptions(
        { domainName },
      ),
      enabled: active && mintedByName.has(domainName),
      refetchInterval: (query: {
        state: { data?: { hasActiveWorkflow?: boolean } };
      }) => (query.state.data?.hasActiveWorkflow ? POLL_MS : false),
    })),
  });
  const anyDnssecActive = dnssecQueries.some((q) => q.data?.hasActiveWorkflow);

  const tasks = useMemo<PostRegistrationTask[]>(
    () => [
      {
        key: 'mint',
        label: 'Minting your NFT',
        status: allMinted ? 'done' : 'in-progress',
        detail:
          total > 1 && !allMinted ? `${mintedCount} of ${total}` : undefined,
      },
      {
        key: 'dnssec',
        label: 'Enabling DNSSEC',
        status: anyDnssecActive
          ? 'in-progress'
          : allMinted
            ? 'done'
            : 'pending',
      },
    ],
    [allMinted, mintedCount, total, anyDnssecActive],
  );

  const allDone = tasks.every((t) => t.status === 'done');

  return { tasks, mintedByName, allDone };
}
