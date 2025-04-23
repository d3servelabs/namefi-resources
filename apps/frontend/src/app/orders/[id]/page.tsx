'use client';

import { AuthRequired } from '@/components/auth-required';
import { CartCard } from '@/components/cart-card';
import { NamefiButton } from '@/components/namefi-button';
import { useOrigin } from '@/components/providers/originProvider';
import { Button } from '@/components/ui/shadcn/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/shadcn/carousel';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useAuth } from '@/hooks/useAuth';
import {
  formatDate,
  getSubDomainAndParentDomainFromNormalizedDomainName,
} from '@/lib/utils';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { SquareArrowOutUpRightIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useMemo } from 'react';

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const trpc = useTRPC();

  const { data: order, isLoading: isOrderLoading } = useQuery({
    ...trpc.orders.getOrder.queryOptions({ orderId: id }),
    enabled: !!id && isAuthenticated,
  });

  const orderItems = useMemo(() => {
    if (!order?.items) {
      return [];
    }
    return order.items.map((item) => {
      const { subdomain, parentDomain } =
        getSubDomainAndParentDomainFromNormalizedDomainName(
          item.normalizedDomainName,
        );
      return {
        subdomain,
        parentDomain,
        fullDomain: item.normalizedDomainName,
      };
    });
  }, [order?.items]);

  const origin = useOrigin();

  if (isAuthLoading || isOrderLoading || origin.isLoading) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>

          <CartCard title="Loading..." className="mb-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black/[0.03]">
              <Skeleton className="h-full w-full" />
            </div>
          </CartCard>

          <div className="mb-6">
            <Skeleton className="h-10 w-full" />
          </div>

          <CartCard
            title="Share"
            className="mb-6 bg-black/[0.03] border-white/10"
          >
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-9 w-9" />
                ))}
              </div>
            </div>
          </CartCard>

          <CartCard
            title="Order Details"
            className="mb-6 bg-black/[0.03] border-white/10"
          >
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </CartCard>

          <div className="flex gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>

          <div className="text-center">
            <Skeleton className="h-6 w-48 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!(isAuthLoading || isAuthenticated)) {
    return (
      <AuthRequired
        title="Sign in required"
        description="Please sign in to view your order details"
      />
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-8">
        <div className="max-w-2xl mx-auto">
          <CartCard
            title="Order not found"
            description="The order you are looking for could not be found. Please check the order ID and try again."
            footer={
              <Button onClick={() => router.push('/orders')}>
                Back to Orders
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
          <p className="text-muted-foreground text-lg">
            Your domains have been successfully registered and your NFTs are on
            the way.
          </p>
        </div>

        <Carousel className="mb-6">
          <CarouselContent className="-ml-2 md:-ml-4">
            {orderItems.map((item, index) => (
              <CarouselItem
                key={index}
                className="md:basis-1/2 lg:basis-1/3 pl-2 md:pl-4"
              >
                <CartCard className="p-4">
                  <div className="relative w-full aspect-square overflow-hidden rounded-md bg-black/[0.03] border-1 border-brand-primary">
                    <Image
                      src="/backgrounds/0x.city.png"
                      alt={item.fullDomain}
                      fill={true}
                      className="object-cover"
                    />
                    <div className="absolute top-4.5 left-4.5">
                      <div className="bg-black/70 backdrop-blur-[50px] py-[2px] px-[3px] gap-[3px] rounded-[2px] flex items-center">
                        {origin.originInfo.config.brandLogo.type ===
                          'image' && (
                          <Image
                            src={origin.originInfo.config.brandLogo.logo}
                            alt={origin.originInfo.config.brandLogo.alt}
                            className="rounded-[1px]"
                            width={14}
                            height={14}
                          />
                        )}
                        <Image
                          src="/powered-by-namefi-stacked.svg"
                          alt="Powered by Namefi"
                          width={25.375}
                          height={16}
                        />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-start text-white p-2 bg-gradient-to-t from-black/90 via-black/10 to-transparent">
                      <h2 className="text-2xl font-semibold">
                        {item.subdomain}
                      </h2>
                      <p className="text-md font-semibold">
                        .{item.parentDomain}
                      </p>
                    </div>
                  </div>
                  <NamefiButton
                    variant="ghost"
                    className="w-full mt-4 bg-black/[0.03] border-white/10"
                    asChild={true}
                  >
                    <Link href={`https://${item.fullDomain}`} target="_blank">
                      View Your Domain
                      <SquareArrowOutUpRightIcon className="w-4 h-4" />
                    </Link>
                  </NamefiButton>
                </CartCard>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <CartCard className="mb-6 bg-black/[0.03] border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Share on</span>
            <div className="flex gap-4">
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-white/10 hover:bg-white/5"
              >
                𝕏
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-white/10 hover:bg-white/5"
              >
                𝕟
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-white/10 hover:bg-white/5"
              >
                𝕥
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent border-white/10 hover:bg-white/5"
              >
                𝕕
              </Button>
            </div>
          </div>
        </CartCard>

        <CartCard
          title="Order Details"
          className="mb-6 bg-black/[0.03] border-white/10"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(new Date(order.createdAt))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Grand total</span>
              <span>${order.totalAmountInUSDCents / 100} USD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Payment</span>
              <span>
                {order.payment?.paymentProvider === 'STRIPE'
                  ? 'Credit card'
                  : order.payment?.paymentProvider}
              </span>
            </div>
          </div>
        </CartCard>

        <div className="flex gap-4 mb-8">
          <NamefiButton
            variant="outline"
            className="flex-1 bg-black/[0.03] border-white/10 hover:bg-white/5"
            asChild={true}
          >
            <Link href="/orders">Order history</Link>
          </NamefiButton>
          <NamefiButton className="flex-1" asChild={true}>
            <Link href="/">Back to home</Link>
          </NamefiButton>
        </div>

        <div className="text-center text-muted-foreground">
          Need help?{' '}
          <Link href="/contact" className="underline hover:text-white">
            Contact us
          </Link>
        </div>
      </div>
    </div>
  );
}
