'use client';

import { use, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { TRPCClientError } from '@trpc/client';
import { type AppRouterOutput, useTRPC } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  getWorkflowProgressPhase,
  type WorkflowProgressPhase,
  useOrderProgress,
} from '@/hooks/use-order-progress';
import { orderStatusSchema } from '@namefi-astra/db/types';
import {
  getSubDomainAndParentDomainFromNormalizedDomainName,
  getTokenIdFromDomainName,
} from '@namefi-astra/utils';
import { AuthRequired } from '@/components/auth-required';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { useOrigin } from '@/components/providers/origin';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Unauthorized } from '@/components/unauthorized';
import { useCartContext } from '@/components/providers/cart';
import { OrderProgressTimeline } from '@/components/orders/order-progress-timeline';
import { InternalAIGenerations } from '@/components/orders/internal-ai-generations';
import { ShareOrder } from '@/components/orders/share-order';
import { PaymentDetailsSummary } from '@/components/orders/payment-details-summary';
import { NftCarousel } from '@/components/orders/nft-carousel';
import { OrderNotFound } from '@/components/orders/order-not-found';
import { motion, AnimatePresence } from 'motion/react';

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
    description: 'We are charging your payment method securely.',
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

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();
  const router = useRouter();

  // This sets the cart count to 0 after the order is created
  const { refetchCart } = useCartContext();
  useEffect(() => {
    refetchCart();
  }, [refetchCart]);

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

  const activeProgressCopy = orderProgress.activeStep?.id
    ? processingCopyByStep[orderProgress.activeStep.id]
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

  return (
    <div className="container mx-auto py-8 px-8">
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

        <AnimatePresence>
          {viewState !== 'success' && !isFailedOrder && (
            <motion.div className="mb-8">
              <OrderProgressTimeline
                progress={orderProgress.data ?? null}
                workflowPhase={timelinePhase}
              />
            </motion.div>
          )}
          {!isFailedOrder && (
            <motion.div>
              <NftCarousel
                items={orderItems}
                origin={origin}
                isCompletedOrder={isCompletedOrder}
              />
            </motion.div>
          )}
          {(viewState === 'success' || viewState === 'failed') && (
            <motion.div>
              {orderDetails && (
                <PaymentDetailsSummary orderWithPayments={orderDetails} />
              )}
            </motion.div>
          )}
          {viewState === 'success' && !isFailedOrder && (
            <motion.div>
              <ShareOrder origin={origin} shareMessage={shareMessage} />
              <InternalAIGenerations
                domains={uniqueDomains}
                internalAIGenerations={internalAiGenerations}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
    </div>
  );
}
