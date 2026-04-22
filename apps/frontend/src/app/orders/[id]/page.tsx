'use client';

import dynamic from 'next/dynamic';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TRPCClientError } from '@trpc/client';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { redirect } from 'next/navigation';
import { AddressWithChain } from '@/components/address-with-chain';
import { useAuth } from '@/hooks/use-auth';
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
import { getSubDomainAndParentDomainFromNormalizedDomainName } from '@namefi-astra/utils/domain-names';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { AuthRequired } from '@/components/auth-required';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import { useOrigin } from '@/components/providers/origin';
import { Skeleton } from '@namefi-astra/ui/components/shadcn/skeleton';
import { Unauthorized } from '@/components/unauthorized';
import { useCartContext } from '@/components/providers/cart';
import { useFeedback } from '@/components/providers/feedback';
import { feedbackTriggerSchema } from '@/lib/feedback-triggers';
import { OrderNotFound } from '@/components/orders/order-not-found';
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

const PaymentDetailsSummary = dynamic(
  () =>
    import('@/components/orders/payment-details-summary').then(
      (mod) => mod.PaymentDetailsSummary,
    ),
  { ssr: false },
);

const ShareOrder = dynamic(
  () => import('@/components/orders/share-order').then((mod) => mod.ShareOrder),
  { ssr: false },
);

const InternalAIGenerations = dynamic(
  () =>
    import('@/components/orders/internal-ai-generations').then(
      (mod) => mod.InternalAIGenerations,
    ),
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

function getProcessingTitle(counts: OrderItemCounts): string {
  const { importCount, registerCount, renewCount, total } = counts;

  if (total === 0) return 'Processing your order';

  const parts: string[] = [];

  if (importCount > 0) {
    parts.push(
      `importing ${importCount} ${importCount === 1 ? 'domain' : 'domains'}`,
    );
  }
  if (registerCount > 0) {
    parts.push(
      `registering ${registerCount} ${registerCount === 1 ? 'domain' : 'domains'}`,
    );
  }
  if (renewCount > 0) {
    parts.push(
      `renewing ${renewCount} ${renewCount === 1 ? 'domain' : 'domains'}`,
    );
  }

  if (parts.length === 0) {
    return `Processing ${total} ${total === 1 ? 'domain' : 'domains'}`;
  }

  // Capitalize the first letter of the first part for proper sentence case
  const firstPart = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);

  if (parts.length === 1) {
    return firstPart;
  }

  const remainingParts = parts.slice(1);
  const lastPart = remainingParts.pop();
  if (remainingParts.length === 0) {
    return `${firstPart} and ${lastPart}`;
  }
  return `${firstPart}, ${remainingParts.join(', ')} and ${lastPart}`;
}

function getProcessingDescription(
  counts: OrderItemCounts,
  stepId: OrderProgressStepId | undefined,
): string {
  const { importCount, registerCount, total } = counts;

  if (stepId === 'items') {
    if (importCount > 0 && registerCount === 0) {
      return 'We are submitting the import request. This typically takes 5-7 days. You can contact your old registrar to expedite. If the domain is locked, you may need to unlock it first.';
    }
    if (importCount > 0 && registerCount > 0) {
      return 'We are registering your domains and submitting import requests. Imports typically take 5-7 days. You can contact your old registrar to expedite. If a domain is locked, you may need to unlock it first.';
    }
    return 'Each domain is being submitted to the registrar.';
  }

  if (stepId === 'post-processing') {
    if (importCount > 0) {
      return 'Your old registrar will contact you to confirm the import. This typically takes 5-7 days.';
    }
    return 'We are refreshing indexes and preparing your on-chain records.';
  }

  if (importCount > 0 && registerCount === 0) {
    return 'We are initiating the import. This typically takes 5-7 days. You can contact your old registrar to expedite.';
  }

  if (importCount > 0 && registerCount > 0) {
    return 'We are processing your domains. Imports typically take 5-7 days.';
  }

  return 'Hang on tight while we wrap things up.';
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
  const { id } = use(params);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
  const { linkedWalletAddresses, linkedWalletsReady } =
    useLinkedWalletAddresses();
  const trpc = useTRPC();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'message' | null>(null);
  const [manageShareUrl, setManageShareUrl] = useState('');

  // This sets the cart count to 0 after the order is created
  const { refetchCart } = useCartContext();
  const { requestFeedback } = useFeedback();
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
      title: getProcessingTitle(itemCounts),
      description: getProcessingDescription(itemCounts, stepId),
    };
  }, [itemCounts, orderProgress.activeStep?.id]);

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

  useEffect(() => {
    const previousPhase = prevWorkflowPhase.current;
    if (workflowPhase === 'terminal' && previousPhase !== 'terminal') {
      refetchOrderDetails();
      refetchInternalAiGenerations();
    }
    prevWorkflowPhase.current = workflowPhase;
  }, [workflowPhase, refetchOrderDetails, refetchInternalAiGenerations]);

  // Track if we've already triggered feedback for this order
  const hasFeedbackTriggeredRef = useRef(false);

  // Trigger feedback when order completes successfully (domain acquired milestone)
  useEffect(() => {
    if (
      isCompletedOrder &&
      !hasFeedbackTriggeredRef.current &&
      orderItems.length > 0
    ) {
      const wasTriggered = requestFeedback(
        feedbackTriggerSchema.enum.MILESTONE_DOMAIN_ACQUIRED,
      );
      // Only mark as triggered if the feedback was actually shown
      // (requestFeedback returns false during hydration or if cooldown is active)
      if (wasTriggered) {
        hasFeedbackTriggeredRef.current = true;
      }
    }
  }, [isCompletedOrder, orderItems.length, requestFeedback]);

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

  const shareManageMessage = useMemo(() => {
    if (!orderItems?.length) {
      return 'Begin managing your domain on Namefi.';
    }

    const domainList = orderItems.map((item) => item.fullDomain).join(', ');
    const domainLabel = orderItems.length > 1 ? 'your domains' : 'your domain';

    return `I've registered ${domainList} for you on Namefi. Begin managing ${domainLabel} here:`;
  }, [orderItems]);

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
      ? 'Congratulations!'
      : viewState === 'failed'
        ? "We couldn't complete your order"
        : activeProgressCopy.title;
  const subheading =
    viewState === 'success'
      ? `You've got your ${
          orderItems.length > 1 ? 'domains' : 'domain'
        } and here ${orderItems.length > 1 ? 'are the NFTs' : 'is the NFT'}`
      : viewState === 'failed'
        ? 'Something went wrong while processing this order. Review the details below.'
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
    return (
      <AuthRequired description="Please sign in to view your order details" />
    );
  }

  if (
    orderDetailsError &&
    orderDetailsError instanceof TRPCClientError &&
    orderDetailsError.data?.code === 'UNAUTHORIZED'
  ) {
    return (
      <Unauthorized description="You are not authorized to view this order." />
    );
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
              <h1 className="text-4xl font-bold mb-3">{heading}</h1>
              <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
                {subheading}
              </p>
              {recipientWalletAddress && (
                <div className="mt-4 flex flex-col items-center gap-2 text-sm">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1">
                    <span className="text-muted-foreground">NFT Wallet</span>
                    <AddressWithChain
                      address={recipientWalletAddress}
                      chainId={recipientChainId}
                    />
                  </div>
                  {!isRecipientLinked && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Info className="h-4 w-4" />
                      <span>This wallet isn't linked to your account.</span>
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
              domainAction={isRecipientSelf ? 'manage' : 'share'}
              onShare={
                isRecipientSelf ? undefined : () => setShareDialogOpen(true)
              }
            />
          </div>
        )}
        {(viewState === 'success' || viewState === 'failed') && (
          <div>
            {orderDetails && (
              <PaymentDetailsSummary orderWithPayments={orderDetails} />
            )}
          </div>
        )}
        {viewState === 'success' && !isFailedOrder && (
          <div>
            <ShareOrder origin={origin} shareMessage={shareMessage} />
            <InternalAIGenerations
              domains={uniqueDomains}
              internalAIGenerations={internalAiGenerations}
              isLoading={isInternalAiGenerationsLoading}
            />
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <NamefiButton
            variant="outline"
            className="flex-1 bg-black/[0.03] border-white/10 hover:bg-white/5"
            render={<Link href={`/orders/${id}/details`} />}
            nativeButton={false}
          >
            View full details
          </NamefiButton>
          <NamefiButton
            className="flex-1"
            render={<Link href="/" />}
            nativeButton={false}
          >
            Back to home
          </NamefiButton>
        </div>
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Share domain access</DialogTitle>
            <DialogDescription>
              Send this message to the recipient so they can begin managing
              their domain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Message</Label>
              <div className="flex items-start gap-2">
                <Textarea
                  value={
                    shareManageUrl
                      ? `${shareManageMessage} ${shareManageUrl}`
                      : shareManageMessage
                  }
                  readOnly
                  className="min-h-[110px] font-medium"
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
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
