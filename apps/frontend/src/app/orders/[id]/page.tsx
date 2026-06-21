'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TRPCClientError } from '@trpc/client';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { redirect } from 'next/navigation';
import { AddressWithChain } from '@/components/address-with-chain';
import { useAuth } from '@/hooks/use-auth';
import { useInvalidateNotifications } from '@/hooks/use-invalidate-notifications';
import {
  useLinkedWalletAddresses,
  useUserWalletAddresses,
} from '@/hooks/use-user-wallet-addresses';
import {
  getWorkflowProgressPhase,
  type WorkflowProgressPhase,
  useOrderProgress,
} from '@/hooks/use-order-progress';
import { orderStatusSchema } from '@namefi-astra/common/shared-schemas';
import {
  MARKETPLACE_LISTINGS_FLAG,
  useBooleanOpenFeatureFlag,
} from '@/lib/openfeature-flags';
import { MARKETPLACE_SUPPORTED_CHAINS } from '@/lib/marketplaces/chains';
import { getSubDomainAndParentDomainFromNormalizedDomainName } from '@namefi-astra/utils/domain-names';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { AuthRequired } from '@/components/auth-required';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { useOrigin } from '@/components/providers/origin';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Unauthorized } from '@/components/unauthorized';
import { useCartContext } from '@/components/providers/cart';
import { OrderNotFound } from '@/components/orders/order-not-found';
import { CompletionActions } from '@/components/orders/completion-actions';
import { FinishingUpInline } from '@/components/orders/finishing-up-inline';
import { usePostRegistrationTasks } from '@/components/orders/use-post-registration-tasks';
import { itemTypeSchema } from '@namefi-astra/common/shared-schemas';
import type { OrderItemSelect } from '@namefi-astra/common/contract/entity-schemas';
import { PageShell } from '@/components/page-shell';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Textarea } from '@namefi-astra/ui/components/shadcn/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@namefi-astra/ui/components/shadcn/dialog';
import { Label } from '@namefi-astra/ui/components/shadcn/label';
import { cn } from '@namefi-astra/ui/lib/cn';
import { MOBILE_BOTTOM_SHEET_DIALOG } from '@/components/dialogs/mobile-bottom-sheet';
import { Check, Copy, Info } from 'lucide-react';

// Dynamically import heavy visualization components to reduce first-hit compile time
const OrderProgressTimeline = dynamic(
  () =>
    import('@/components/orders/order-progress-timeline').then(
      (mod) => mod.OrderProgressTimeline,
    ),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> },
);

const NftCarousel = dynamic(
  () =>
    import('@/components/orders/nft-carousel').then((mod) => mod.NftCarousel),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> },
);

// Heavy: pulls the marketplace modal + wagmi/adapter weight. Keep it off the
// order-page shell — it only loads when a self-recipient success renders it.
const ListOnMarketplaceEntry = dynamic(
  () =>
    import('@/components/orders/list-on-marketplace-entry-runtime').then(
      (mod) => mod.ListOnMarketplaceEntryRuntime,
    ),
  { ssr: false },
);

const ShareOrder = dynamic(
  () => import('@/components/orders/share-order').then((mod) => mod.ShareOrder),
  { ssr: false },
);

const INTERNAL_AI_POLL_INTERVAL_MS = 3_000;
const INTERNAL_AI_POLL_TIMEOUT_MS = 120_000;

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

type OrderProgressStepId = NonNullable<
  AppRouterOutput['orders']['getOrderProgress']['state']
>['steps'][number]['id'];

type InternalAIGenerationsByDomains =
  AppRouterOutput['ai']['getInternalGenerationsByDomains'];

type OrderItemCounts = {
  importCount: number;
  registerCount: number;
  renewCount: number;
  total: number;
};

function getOrderItemCounts(items: OrderItemSelect[]): OrderItemCounts {
  const activeItems = items.filter(
    (item) => item.status !== 'FAILED' && item.status !== 'CANCELLED',
  );
  return {
    importCount: activeItems.filter(
      (item) => item.type === itemTypeSchema.enum.IMPORT,
    ).length,
    registerCount: activeItems.filter(
      (item) => item.type === itemTypeSchema.enum.REGISTER,
    ).length,
    renewCount: activeItems.filter(
      (item) => item.type === itemTypeSchema.enum.RENEW,
    ).length,
    total: activeItems.length,
  };
}

type OrdersTranslator = ReturnType<typeof useTranslations<'orders'>>;

function getProcessingTitle(
  t: OrdersTranslator,
  counts: OrderItemCounts,
): string {
  const { importCount, registerCount, renewCount, total } = counts;

  if (total === 0) return t('processing.processingYourOrder');

  const parts: string[] = [];

  if (importCount > 0) {
    parts.push(t('processing.importing', { count: importCount }));
  }
  if (registerCount > 0) {
    parts.push(t('processing.registering', { count: registerCount }));
  }
  if (renewCount > 0) {
    parts.push(t('processing.renewing', { count: renewCount }));
  }

  if (parts.length === 0) {
    return t('processing.processingDomains', { count: total });
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const remainingParts = parts.slice(1);
  const lastPart = remainingParts.pop() as string;
  if (remainingParts.length === 0) {
    return t('processing.joinTwo', { first: parts[0], last: lastPart });
  }
  // With only import/register/renew item types, `remainingParts` is at most a
  // single element here, so the join separator is never actually rendered.
  return t('processing.joinMany', {
    first: parts[0],
    middle: remainingParts.join(', '),
    last: lastPart,
  });
}

function getProcessingDescription(
  t: OrdersTranslator,
  counts: OrderItemCounts,
  stepId: OrderProgressStepId | undefined,
): string {
  const { importCount, registerCount } = counts;

  if (stepId === 'items') {
    if (importCount > 0 && registerCount === 0) {
      return t('processing.descItemsImportOnly');
    }
    if (importCount > 0 && registerCount > 0) {
      return t('processing.descItemsImportAndRegister');
    }
    return t('processing.descItemsDefault');
  }

  if (stepId === 'post-processing') {
    if (importCount > 0) {
      return t('processing.descPostProcessingImport');
    }
    return t('processing.descPostProcessingDefault');
  }

  if (importCount > 0 && registerCount === 0) {
    return t('processing.descImportOnly');
  }

  if (importCount > 0 && registerCount > 0) {
    return t('processing.descImportAndRegister');
  }

  return t('processing.descDefault');
}

function hasLogoPreviewsForAllDomains(
  domains: string[],
  internalAiGenerations: InternalAIGenerationsByDomains | undefined,
): boolean {
  if (domains.length === 0) {
    return true;
  }

  return domains.every((domain) =>
    (internalAiGenerations?.[domain] ?? []).some((generation) => {
      return generation.type === 'logo' && Boolean(generation.url);
    }),
  );
}

export default function OrderPage({ params }: OrderPageProps) {
  const t = useTranslations('orders');
  const tCommon = useTranslations('common');
  const { id } = use(params);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const trpc = useTRPC();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'message' | null>(null);
  const [manageShareUrl, setManageShareUrl] = useState('');
  // Redesigned success view (Option C): Share / List reveal their panels on
  // demand so the celebration + actions stay the hero.
  const [showShareSection, setShowShareSection] = useState(false);
  const [showListSection, setShowListSection] = useState(false);

  // This sets the cart count to 0 after the order is created
  const { refetchCart } = useCartContext();
  useEffect(() => {
    refetchCart();
  }, [refetchCart]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setManageShareUrl(window.location.origin);
    }
  }, []);

  const {
    data: orderDetails,
    isLoading: isOrderDetailsLoading,
    error: orderDetailsError,
    refetch: refetchOrderDetails,
  } = useQuery({
    ...trpc.orders.getOrder.queryOptions(
      { orderId: id },
      {
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      },
    ),
    enabled: isAuthenticated,
    retry(failureCount, error) {
      if (failureCount >= 3) {
        return false;
      }
      if (
        error instanceof TRPCClientError &&
        error.data?.code === 'UNAUTHORIZED'
      ) {
        return false;
      }
      return true;
    },
  });

  const { order, items = [] } = orderDetails ?? {};

  const isFailedOrder =
    order?.status === orderStatusSchema.enum.FAILED ||
    order?.status === orderStatusSchema.enum.CANCELLED;

  const isCompletedOrder =
    order?.status === orderStatusSchema.enum.SUCCEEDED ||
    order?.status === orderStatusSchema.enum.PARTIALLY_COMPLETED;

  const hasOrderDetails = Boolean(order);
  const [hasInternalAiPollingTimedOut, setHasInternalAiPollingTimedOut] =
    useState(false);
  const domainsRaw = items.map((it) => it.normalizedDomainName);
  const uniqueDomains = Array.from(new Set(domainsRaw));
  const { data: internalAiGenerations, refetch: refetchInternalAiGenerations } =
    useQuery({
      ...trpc.ai.getInternalGenerationsByDomains.queryOptions({
        domains: uniqueDomains,
      }),
      enabled: uniqueDomains.length > 0,
      refetchOnWindowFocus: false,
      refetchInterval: (query) => {
        if (
          !isCompletedOrder ||
          uniqueDomains.length === 0 ||
          hasInternalAiPollingTimedOut
        ) {
          return false;
        }

        const queryData = query.state.data as
          | InternalAIGenerationsByDomains
          | undefined;
        if (hasLogoPreviewsForAllDomains(uniqueDomains, queryData)) {
          return false;
        }

        return INTERNAL_AI_POLL_INTERVAL_MS;
      },
      refetchIntervalInBackground: true,
    });
  const hasLogoPreviews = hasLogoPreviewsForAllDomains(
    uniqueDomains,
    internalAiGenerations,
  );
  useEffect(() => {
    if (!isCompletedOrder || uniqueDomains.length === 0 || hasLogoPreviews) {
      setHasInternalAiPollingTimedOut(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasInternalAiPollingTimedOut(true);
    }, INTERNAL_AI_POLL_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCompletedOrder, uniqueDomains.length, hasLogoPreviews]);
  const isInternalAiGenerationsLoading =
    isCompletedOrder &&
    uniqueDomains.length > 0 &&
    !hasLogoPreviews &&
    !hasInternalAiPollingTimedOut;

  const isLoading = isAuthLoading || isOrderDetailsLoading;

  // TODO: (Sid) we should fetch this once but then stop polling once we know order is completed or failed
  const orderProgress = useOrderProgress(id, {
    enabled: isAuthenticated,
  });

  const itemCounts = useMemo(() => getOrderItemCounts(items), [items]);

  const activeProgressCopy = useMemo(() => {
    const stepId = orderProgress.activeStep?.id;
    return {
      title: getProcessingTitle(t, itemCounts),
      description: getProcessingDescription(t, itemCounts, stepId),
    };
  }, [t, itemCounts, orderProgress.activeStep?.id]);

  const orderItems = useMemo(() => {
    if (!items) {
      return [];
    }
    const chainId = order?.nftChainId ?? null;

    return items
      .filter(
        (item) =>
          item.status !== orderStatusSchema.enum.FAILED &&
          item.status !== orderStatusSchema.enum.CANCELLED,
      )
      .map((item) => {
        const { subdomain, parentDomain } =
          getSubDomainAndParentDomainFromNormalizedDomainName(
            item.normalizedDomainName,
          );
        const tokenId = getTokenIdFromDomainName(item.normalizedDomainName);

        return {
          subdomain,
          parentDomain,
          fullDomain: item.normalizedDomainName,
          tokenId,
          chainId,
          hasMintedNft: item.status === orderStatusSchema.enum.SUCCEEDED,
        };
      });
  }, [items, order?.nftChainId]);

  const workflowPhase = getWorkflowProgressPhase(orderProgress.data ?? null);
  const prevWorkflowPhase = useRef<WorkflowProgressPhase>(workflowPhase);
  const invalidateNotifications = useInvalidateNotifications();

  useEffect(() => {
    const previousPhase = prevWorkflowPhase.current;
    if (workflowPhase === 'terminal' && previousPhase !== 'terminal') {
      refetchOrderDetails();
      refetchInternalAiGenerations();
      // The order workflow writes an in-app notification on settlement;
      // refresh the bell now instead of waiting for its next poll tick.
      invalidateNotifications();
    }
    prevWorkflowPhase.current = workflowPhase;
  }, [
    workflowPhase,
    refetchOrderDetails,
    refetchInternalAiGenerations,
    invalidateNotifications,
  ]);

  const viewState: 'loading' | 'processing' | 'success' | 'failed' = (() => {
    if (!hasOrderDetails) {
      return 'loading';
    }
    if (isFailedOrder) {
      return 'failed';
    }
    if (isCompletedOrder) {
      return 'success';
    }
    if (workflowPhase === 'loading') {
      return 'loading';
    }
    return 'processing';
  })();

  const origin = useOrigin();

  const shareMessage = useMemo(() => {
    if (orderItems?.length === 0) {
      return '';
    }

    const domainList = orderItems.map((item) => item.fullDomain).join(', ');

    return orderItems.length > 1
      ? `Great I've just got ${domainList} from 0x.city (#PoweredByNamefi), come check it out!`
      : `Great I've just got ${orderItems[0].fullDomain} from 0x.city (#PoweredByNamefi), come check it out`;
  }, [orderItems]);

  const recipientWalletAddress = order?.nftWalletAddress ?? null;
  const recipientChainId = order?.nftChainId ?? null;
  const isRecipientSelf = useMemo(() => {
    if (!recipientWalletAddress) return true;
    if (!userWalletsReady) return true;
    const normalizedRecipient = recipientWalletAddress.toLowerCase();
    return userWalletAddresses.some(
      (address) => address.toLowerCase() === normalizedRecipient,
    );
  }, [recipientWalletAddress, userWalletAddresses, userWalletsReady]);
  const isRecipientLinked = useMemo(() => {
    if (!recipientWalletAddress) return true;
    if (!linkedWalletsReady) return true;
    const normalizedRecipient = recipientWalletAddress.toLowerCase();
    return linkedWalletAddresses.some(
      (address) => address.toLowerCase() === normalizedRecipient,
    );
  }, [linkedWalletAddresses, linkedWalletsReady, recipientWalletAddress]);

  const marketplaceListingEnabled = useBooleanOpenFeatureFlag(
    MARKETPLACE_LISTINGS_FLAG,
  );

  // NFT minting is async and decoupled from registration, so an order item
  // being SUCCEEDED does NOT mean the token exists on-chain yet. Gate listing on
  // the indexer instead: a domain is listable only once it shows up as owned by
  // the recipient wallet (i.e. minted AND visible on-chain) — which is also what
  // the marketplace needs to find the token.
  const ownedDomainsQuery = useQuery(
    trpc.registry.getDomainsByOwner.queryOptions(
      { identifier: recipientWalletAddress ?? '' },
      {
        // Mint status is order-level (drives the minting indicator + copy), so
        // this runs for any self-recipient — the listing CTA stays flag-gated.
        enabled:
          isAuthenticated &&
          userWalletsReady &&
          isRecipientSelf &&
          Boolean(recipientWalletAddress),
        // Poll while a registered domain hasn't been indexed yet, so the minting
        // indicator clears and the "List" entry auto-unlocks the moment minting
        // + indexing completes.
        refetchInterval: (query) => {
          if (viewState !== 'success' || orderItems.length === 0) return false;
          // Stop only once every order domain is minted *and tokenized* — name
          // presence alone isn't enough, since listability + the minting hint
          // both key off a non-null tokenId. Polling on name-only would strand
          // a name-without-tokenId in a perpetual "minting" state.
          const mintedNames = new Set(
            (query.state.data?.domains ?? [])
              .filter((d) => d.tokenId)
              .map((d) => d.normalizedDomainName),
          );
          return orderItems.every((i) => mintedNames.has(i.fullDomain))
            ? false
            : 8000;
        },
      },
    ),
  );

  // Indexer truth: domain -> on-chain { chainId, tokenId } for the recipient.
  const indexedByName = useMemo(() => {
    const map = new Map<string, { chainId: number; tokenId: string }>();
    for (const d of ownedDomainsQuery.data?.domains ?? []) {
      if (d.tokenId) {
        map.set(d.normalizedDomainName, {
          chainId: d.chainId,
          tokenId: d.tokenId,
        });
      }
    }
    return map;
  }, [ownedDomainsQuery.data]);

  const listableDomains = useMemo(
    () =>
      orderItems.flatMap((item) => {
        const indexed = indexedByName.get(item.fullDomain);
        // Only domains on a marketplace-supported chain are actually listable —
        // keep `canList` in lockstep with what ListOnMarketplaceEntry renders,
        // so the CTA never opens an empty panel.
        return indexed && MARKETPLACE_SUPPORTED_CHAINS.includes(indexed.chainId)
          ? [
              {
                fullDomain: item.fullDomain,
                tokenId: indexed.tokenId,
                chainId: indexed.chainId,
              },
            ]
          : [];
      }),
    [orderItems, indexedByName],
  );

  // Domains the order registered that aren't minted+indexed yet (still minting).
  // `mintPending` requires the indexer query to have actually resolved, so we
  // never claim "minting" when the query is disabled or still loading.
  const pendingDomains = useMemo(
    () =>
      orderItems
        .filter((item) => !indexedByName.has(item.fullDomain))
        .map((item) => item.fullDomain),
    [orderItems, indexedByName],
  );
  const mintPending = useMemo(
    () =>
      ownedDomainsQuery.isSuccess &&
      viewState === 'success' &&
      orderItems.length > 0 &&
      pendingDomains.length > 0,
    [ownedDomainsQuery.isSuccess, viewState, orderItems.length, pendingDomains],
  );

  // Background "what's still running" tasks (mint, DNS, DNSSEC, parking). Shares
  // the getDomainsByOwner cache with the listing gate above (same query key).
  const orderDomainNames = useMemo(
    () => orderItems.map((item) => item.fullDomain),
    [orderItems],
  );
  const { tasks: postRegistrationTasks } = usePostRegistrationTasks({
    domains: orderDomainNames,
    walletAddress: recipientWalletAddress,
    enabled:
      viewState === 'success' &&
      userWalletsReady &&
      isRecipientSelf &&
      Boolean(recipientWalletAddress),
  });

  const shareManageMessage = useMemo(() => {
    if (!orderItems?.length) {
      return t('detail.shareManageDefault');
    }

    const domainList = orderItems.map((item) => item.fullDomain).join(', ');

    return t('detail.shareManageMessage', {
      domains: domainList,
      count: orderItems.length,
    });
  }, [t, orderItems]);

  const shareManageUrl = useMemo(() => {
    if (!manageShareUrl) return '';
    if (orderItems.length === 1) {
      return `${manageShareUrl}/domains/${orderItems[0].fullDomain}`;
    }
    return `${manageShareUrl}/domains`;
  }, [manageShareUrl, orderItems]);

  const handleCopy = (value: string, field: 'message') => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    window.setTimeout(() => setCopiedField(null), 2000);
  };

  const heading =
    viewState === 'success'
      ? t('detail.congratulations')
      : viewState === 'failed'
        ? t('detail.couldNotComplete')
        : activeProgressCopy.title;
  const subheading =
    viewState === 'success'
      ? mintPending
        ? // Registration is done but the NFT isn't on-chain yet — don't claim
          // "here is the NFT". Say what's true and what's still happening.
          // TODO(i18n): add an order translation key for this mint-pending copy.
          `Your ${orderItems.length > 1 ? 'domains are' : 'domain is'} registered. We're minting your ${orderItems.length > 1 ? 'NFTs' : 'NFT'} now — you can manage ${orderItems.length > 1 ? 'them' : 'it'} right away.`
        : t('detail.successSubheading', { count: orderItems.length })
      : viewState === 'failed'
        ? t('detail.failedSubheading')
        : activeProgressCopy.description;
  const timelinePhase: WorkflowProgressPhase =
    viewState === 'loading'
      ? 'loading'
      : workflowPhase === 'terminal' ||
          viewState === 'failed' ||
          viewState === 'success'
        ? 'terminal'
        : 'processing';

  if (!(isAuthLoading || isAuthenticated)) {
    return <AuthRequired description={t('detail.authRequired')} />;
  }

  if (
    orderDetailsError &&
    orderDetailsError instanceof TRPCClientError &&
    orderDetailsError.data?.code === 'UNAUTHORIZED'
  ) {
    return <Unauthorized description={t('detail.unauthorized')} />;
  }

  if (!isLoading && !hasOrderDetails) {
    return <OrderNotFound />;
  }

  if (isFailedOrder) {
    return redirect(`/orders/${id}/details`);
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          {viewState === 'loading' ? (
            <>
              <Skeleton className="mx-auto mb-3 h-10 w-64 max-w-full" />
              <Skeleton className="mx-auto h-5 w-80 max-w-full" />
            </>
          ) : (
            <>
              <h1
                className="mb-3 text-balance break-words font-bold text-2xl sm:text-4xl"
                data-testid="orders.detail.heading"
              >
                {heading}
              </h1>
              <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
                {subheading}
              </p>
              {recipientWalletAddress && (
                <div className="mt-4 flex flex-col items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1">
                    <span className="text-muted-foreground">
                      {t('detail.nftWallet')}
                    </span>
                    <AddressWithChain
                      address={recipientWalletAddress}
                      chainId={recipientChainId}
                      data-testid="orders.detail.nft-wallet"
                    />
                  </div>
                  {!isRecipientLinked && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Info className="h-4 w-4" />
                      <span>{t('details.walletNotLinked')}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {viewState !== 'success' && !isFailedOrder && (
          <div className="mb-8">
            <OrderProgressTimeline
              progress={orderProgress.data ?? null}
              workflowPhase={timelinePhase}
            />
          </div>
        )}
        {!isFailedOrder && (
          <div>
            <NftCarousel
              items={orderItems}
              origin={origin}
              isCompletedOrder={isCompletedOrder}
            />
          </div>
        )}
        {viewState === 'success' && !isFailedOrder && (
          <>
            {/* PRIMARY ACTIONS — Manage · Share · List for Sale */}
            <div className="mt-8 flex justify-center">
              <CompletionActions
                manageHref={
                  orderItems.length === 1
                    ? `/domains/${orderItems[0].fullDomain}`
                    : '/domains'
                }
                onShare={
                  // Recipient is self → reveal the social-share block. Sent to
                  // someone else (a gift) → open the manage-access handoff
                  // dialog so the buyer can pass the manage link along.
                  isRecipientSelf
                    ? () => setShowShareSection((s) => !s)
                    : () => setShareDialogOpen(true)
                }
                onList={() => setShowListSection((s) => !s)}
                canList={
                  userWalletsReady &&
                  isRecipientSelf &&
                  marketplaceListingEnabled &&
                  Boolean(recipientWalletAddress) &&
                  listableDomains.length > 0
                }
                multiple={orderItems.length > 1}
              />
            </div>

            {showShareSection && (
              <div className="mt-6">
                <ShareOrder origin={origin} shareMessage={shareMessage} />
              </div>
            )}

            {showListSection &&
              userWalletsReady &&
              isRecipientSelf &&
              marketplaceListingEnabled &&
              recipientWalletAddress &&
              listableDomains.length > 0 && (
                <div className="mt-6">
                  <ListOnMarketplaceEntry
                    domains={listableDomains}
                    ownerAddress={recipientWalletAddress}
                  />
                </div>
              )}

            {/* DEMOTED — what's still finishing (Minting / DNSSEC / Just AIng,
                each tappable for details) + the path to everything else. */}
            <div className="mt-9 flex flex-col items-center gap-2">
              {userWalletsReady &&
                isRecipientSelf &&
                recipientWalletAddress && (
                  <FinishingUpInline
                    tasks={postRegistrationTasks}
                    aiDomains={uniqueDomains}
                    aiGenerations={internalAiGenerations}
                    aiLoading={isInternalAiGenerationsLoading}
                  />
                )}
              <Link
                href={`/orders/${id}/details`}
                className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                data-testid="orders.detail.view-details-link"
              >
                View full details →
              </Link>
            </div>
          </>
        )}

        {viewState !== 'success' && (
          <div className="mb-8 flex gap-4">
            <NamefiButton
              variant="outline"
              className="flex-1 bg-black/[0.03] border-white/10 hover:bg-white/5"
              render={<Link href={`/orders/${id}/details`} />}
              nativeButton={false}
              data-testid="orders.detail.view-full-details"
            >
              {t('detail.viewFullDetails')}
            </NamefiButton>
            <NamefiButton
              className="flex-1"
              render={<Link href="/" />}
              nativeButton={false}
              data-testid="orders.detail.back-to-home"
            >
              {t('detail.backToHome')}
            </NamefiButton>
          </div>
        )}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent
          className={cn(MOBILE_BOTTOM_SHEET_DIALOG, 'sm:max-w-[560px]')}
          data-testid="orders.detail.share-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t('detail.shareDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('detail.shareDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>{t('detail.message')}</Label>
              <div className="flex items-start gap-2">
                <Textarea
                  value={
                    shareManageUrl
                      ? `${shareManageMessage} ${shareManageUrl}`
                      : shareManageMessage
                  }
                  readOnly
                  className="min-h-[110px] font-medium"
                  data-testid="orders.detail.share-message"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    handleCopy(
                      `${shareManageMessage} ${shareManageUrl}`.trim(),
                      'message',
                    )
                  }
                  disabled={!shareManageMessage}
                  data-testid="orders.detail.share-copy"
                >
                  {copiedField === 'message' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShareDialogOpen(false)}
              data-testid="orders.detail.share-close"
            >
              {tCommon('actions.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
