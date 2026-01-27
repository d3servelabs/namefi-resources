'use client';

import dynamic from 'next/dynamic';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TRPCClientError } from '@trpc/client';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { redirect } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useUserWalletAddresses } from '@/hooks/use-user-wallet-addresses';
import {
  getWorkflowProgressPhase,
  type WorkflowProgressPhase,
  useOrderProgress,
} from '@/hooks/use-order-progress';
import { orderStatusSchema } from '@namefi-astra/common/shared-schemas';
import { getSubDomainAndParentDomainFromNormalizedDomainName } from '@namefi-astra/utils/domain-names';
import { getTokenIdFromDomainName } from '@namefi-astra/utils/nft-hash';
import { AuthRequired } from '@/components/auth-required';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { useOrigin } from '@/components/providers/origin';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Unauthorized } from '@/components/unauthorized';
import { useCartContext } from '@/components/providers/cart';
import { useFeedback } from '@/components/providers/feedback';
import { feedbackTriggerSchema } from '@/lib/feedback-triggers';
import { OrderNotFound } from '@/components/orders/order-not-found';
import {
  hasImportItems,
  isImportOnlyOrder,
} from '@/components/orders/import-order-status';
import { PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/shadcn/button';
import { Textarea } from '@/components/ui/shadcn/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Label } from '@/components/ui/shadcn/label';
import { Check, Copy } from 'lucide-react';

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

const ImportOrderStatus = dynamic(
  () =>
    import('@/components/orders/import-order-status').then(
      (mod) => mod.ImportOrderStatus,
    ),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full" /> },
);

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

type OrderProgressStepId = NonNullable<
  AppRouterOutput['orders']['getOrderProgress']['state']
>['steps'][number]['id'];

const defaultProcessingCopy = {
  title: 'Great! We are ready to secure your domain',
  description: 'Hang on tight while we wrap things up.',
};

const processingCopyByStep: Record<
  OrderProgressStepId,
  { title: string; description: string }
> = {
  'order-details': {
    title: 'Checking your order details',
    description: 'We are verifying your wallet and domain selections.',
  },
  payments: {
    title: 'Collecting payment',
    description:
      'We are processing your payment. Blockchain payments may take 30+ seconds for transaction confirmation.',
  },
  items: {
    title: 'Registering your domains',
    description: 'Each domain is being submitted to the registrar.',
  },
  'post-processing': {
    title: 'Finishing background tasks',
    description:
      'We are refreshing indexes and preparing your on-chain records.',
  },
  'final-status': {
    title: 'Wrapping up your order',
    description: 'We are applying the final status to your order.',
  },
  refund: {
    title: 'Refunding any failed items',
    description: 'Refunds are being initiated for domains we could not secure.',
  },
  notification: {
    title: 'Sending confirmation',
    description:
      'We will email you the final summary once everything is ready.',
  },
};

const importProcessingCopyByStep: Record<
  OrderProgressStepId,
  { title: string; description: string }
> = {
  'order-details': {
    title: 'Checking your import details',
    description: 'We are verifying your wallet and domain selections.',
  },
  payments: {
    title: 'Collecting payment',
    description:
      'We are processing your payment. Blockchain payments may take 30+ seconds for transaction confirmation.',
  },
  items: {
    title: 'Initiating domain transfer',
    description:
      'We are submitting the transfer request to your current registrar.',
  },
  'post-processing': {
    title: 'Transfer in progress',
    description:
      'Your old registrar will contact you to confirm the transfer. This typically takes 5-7 days.',
  },
  'final-status': {
    title: 'Completing your import',
    description:
      'We are finalizing the transfer and preparing your domain NFT.',
  },
  refund: {
    title: 'Refunding any failed items',
    description: 'Refunds are being initiated for domains we could not import.',
  },
  notification: {
    title: 'Sending confirmation',
    description:
      'We will email you the final summary once everything is ready.',
  },
};

const defaultImportProcessingCopy = {
  title: 'Importing your domain',
  description: 'We are initiating the transfer from your current registrar.',
};

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { userWalletAddresses, userWalletsReady } = useUserWalletAddresses();
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
  const domainsRaw = items.map((it) => it.normalizedDomainName);
  const uniqueDomains = Array.from(new Set(domainsRaw));
  const { data: internalAiGenerations, refetch: refetchInternalAiGenerations } =
    useQuery({
      ...trpc.ai.getInternalGenerationsByDomains.queryOptions({
        domains: uniqueDomains,
      }),
      enabled: uniqueDomains.length > 0,
    });

  const isLoading = isAuthLoading || isOrderDetailsLoading;

  // TODO: (Sid) we should fetch this once but then stop polling once we know order is completed or failed
  const orderProgress = useOrderProgress(id, {
    enabled: isAuthenticated,
  });

  const isImportOrder = useMemo(() => hasImportItems(items), [items]);
  const isImportOnly = useMemo(() => isImportOnlyOrder(items), [items]);

  const activeProgressCopy = orderProgress.activeStep?.id
    ? isImportOrder
      ? (importProcessingCopyByStep[orderProgress.activeStep.id] ??
        defaultImportProcessingCopy)
      : (processingCopyByStep[orderProgress.activeStep.id] ??
        defaultProcessingCopy)
    : isImportOrder
      ? defaultImportProcessingCopy
      : defaultProcessingCopy;

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
      hasFeedbackTriggeredRef.current = true;
      requestFeedback(feedbackTriggerSchema.enum.MILESTONE_DOMAIN_ACQUIRED);
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
  const isRecipientSelf = useMemo(() => {
    if (!recipientWalletAddress) return true;
    if (!userWalletsReady) return true;
    const normalizedRecipient = recipientWalletAddress.toLowerCase();
    return userWalletAddresses.some(
      (address) => address.toLowerCase() === normalizedRecipient,
    );
  }, [recipientWalletAddress, userWalletAddresses, userWalletsReady]);

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
            </>
          )}
        </div>

        {viewState !== 'success' && !isFailedOrder && isImportOnly && (
          <div className="mb-8">
            <ImportOrderStatus items={items} />
          </div>
        )}
        {viewState !== 'success' && !isFailedOrder && !isImportOnly && (
          <div className="mb-8">
            <OrderProgressTimeline
              progress={orderProgress.data ?? null}
              workflowPhase={timelinePhase}
            />
          </div>
        )}
        {!isFailedOrder && (!isImportOnly || viewState === 'success') && (
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
            />
          </div>
        )}

        <div className="flex gap-4 mb-8">
          <NamefiButton
            variant="outline"
            className="flex-1 bg-black/[0.03] border-white/10 hover:bg-white/5"
            asChild={true}
          >
            <Link href={`/orders/${id}/details`}>View full details</Link>
          </NamefiButton>
          <NamefiButton className="flex-1" asChild={true}>
            <Link href="/">Back to home</Link>
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
