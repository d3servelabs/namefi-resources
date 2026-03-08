'use client';

import { CartCard } from '@/components/cart-card';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth } from '@/hooks/use-auth';
import { useCartRow } from '@/hooks/use-cart-row';
import { cn } from '@/lib/cn';
import { useTRPC } from '@/lib/trpc';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import { namefiNormalizedDomainSchema } from '@namefi-astra/utils/namefi-flavor';
import { parseDomainName } from '@namefi-astra/utils/parse-domain-name';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import { NftWalletCard } from '@/components/nft-wallet-card';
import { NamefiButton } from '@/components/buttons/namefi-button';
import { AuthRequiredCard } from '@/components/payment-method/select-payment-method-card';
import { UserDropdown } from '@/components/dropdowns/user-dropdown';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import confetti from 'canvas-confetti';
import { PageShell } from '@/components/page-shell';

export default function ClaimPage() {
  const router = useRouter();
  const params = useParams<{ domain: string }>();
  const rawDomainParam = params?.domain ?? '';
  const [isLinkedOrUserConfirmed, setIsLinkedOrUserConfirmed] = useState(true);

  // Validate normalized domain via shared schema
  const parsed = namefiNormalizedDomainSchema.safeParse(rawDomainParam);
  const normalizedDomainName = parsed.success ? parsed.data : null;

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const hasFiredConfettiRef = useRef(false);
  const { cart } = useCartRow(normalizedDomainName ?? undefined);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<
    string | null
  >(null);

  const {
    data: availabilityInfo,
    isFetching: isAvailabilityFetching,
    isLoading: isAvailabilityLoading,
  } = useQuery({
    ...trpc.search.isDomainAvailable.queryOptions(
      { domain: normalizedDomainName ?? '' },
      { trpc: { context: { skipBatch: true } } },
    ),
    enabled: !!normalizedDomainName,
  });

  const {
    data: eligibilityResults,
    isFetching: isEligibilityFetching,
    isLoading: isEligibilityLoading,
  } = useQuery({
    ...trpc.search.checkFreeClaimEligibility.queryOptions({
      domains: normalizedDomainName ? [normalizedDomainName] : [],
    }),
    enabled: isAuthenticated && !!normalizedDomainName,
  });

  const isEligible = useMemo(() => {
    if (!eligibilityResults || !normalizedDomainName) return false;
    const entry = eligibilityResults.find(
      (e) => e.domain === normalizedDomainName,
    );
    return entry?.eligible === true;
  }, [eligibilityResults, normalizedDomainName]);

  const minDuration = useMemo(() => {
    return availabilityInfo?.durationValidationInYears?.min ?? 1;
  }, [availabilityInfo]);
  const parentDomain = useMemo(() => {
    if (!normalizedDomainName) {
      return undefined;
    }

    const parsedDomainName = parseDomainName(normalizedDomainName);

    return parsedDomainName.valid &&
      parsedDomainName.registryType === 'subdomain'
      ? parsedDomainName.nearestTraditionalParentDomain
      : undefined;
  }, [normalizedDomainName]);

  const registrarKey = availabilityInfo?.registrarKey || 'namefi';

  const { mutate: processClaim, isPending: isClaimPending } = useMutation({
    ...trpc.freeClaims.processClaimWithTransaction.mutationOptions({
      onSuccess: (result) => {
        toast.success('Domain claimed successfully!');
        queryClient.invalidateQueries({
          queryKey: trpc.freeClaims.getUserClaims.queryKey(),
        });
        if (result.orderId) {
          router.push(`/orders/${result.orderId}`);
        }
      },
      onError: (error) => {
        toast.error(`Failed to claim domain: ${error.message}`);
      },
    }),
  });

  const handleSubmitClaim = useCallback(() => {
    if (!normalizedDomainName || !availabilityInfo || !isEligible) return;
    const recipientWalletAddress = selectedWalletAddress || '';
    processClaim({
      normalizedDomainName,
      recipientWalletAddress,
      registrarKey,
    });
  }, [
    normalizedDomainName,
    availabilityInfo,
    isEligible,
    selectedWalletAddress,
    processClaim,
    registrarKey,
  ]);

  const handleAddToCart = useCallback(async () => {
    if (!availabilityInfo) return;
    await cart.addItem({
      domainAvailabilityInfo: availabilityInfo as DomainAvailabilityInfo,
      durationInYears: minDuration,
      operationType: 'REGISTER',
    });
    router.push('/cart');
  }, [availabilityInfo, cart, minDuration, router]);

  const isInitialLoading =
    isAuthLoading || isAvailabilityLoading || isEligibilityLoading;
  const isAnyFetching = isAvailabilityFetching || isEligibilityFetching;

  const showIneligibleBanner = isAuthenticated && !isAnyFetching && !isEligible;

  // Reset the confetti fired flag whenever the domain changes
  useEffect(() => {
    hasFiredConfettiRef.current = false;
    // Intentionally do not include the domain in deps to appease strict lint
    // and avoid re-creating the effect; the parent component remounts this page
    // on route change so this effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAnyFetching && isEligible && !hasFiredConfettiRef.current) {
      hasFiredConfettiRef.current = true;
      const end = Date.now() + 3 * 1000; // 3 seconds
      const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1'];
      let rafId: number | null = null;

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });

        rafId = requestAnimationFrame(frame);
      };

      rafId = requestAnimationFrame(frame);
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
      };
    }
  }, [isAnyFetching, isEligible]);

  if (isInitialLoading) {
    return (
      <PageShell padding="roomy" className="space-y-6">
        {/* Heading */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Domain summary */}
        <CartCard>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-[280px]" />
            <Skeleton className="h-5 w-[180px]" />
          </div>
        </CartCard>

        {/* Wallet */}
        <CartCard>
          <div className="flex flex-col gap-4 mt-2">
            <Skeleton className="h-10 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>
        </CartCard>

        {/* Button */}
        <div>
          <Skeleton className="h-10 w-full" />
        </div>
      </PageShell>
    );
  }

  if (!normalizedDomainName) {
    return (
      <PageShell size="narrow" padding="relaxed">
        <CartCard
          title="Invalid domain"
          description="The provided domain is not a valid normalized Namefi domain."
          footer={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="size-4" /> Go back
              </Button>
            </div>
          }
        >
          <div className="text-sm text-muted-foreground">
            Make sure you are using a fully normalized domain, e.g.
            "alice.0x.city".
          </div>
        </CartCard>
      </PageShell>
    );
  }

  return (
    <PageShell padding="roomy">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Free Claim</h1>
      </div>

      {showIneligibleBanner && (
        <div
          className={cn(
            'rounded-lg border p-4 flex items-start gap-3',
            'border-amber-500/40 bg-amber-500/10',
          )}
        >
          <AlertTriangle className="size-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-amber-200">
              This domain is not eligible for a free claim.
            </p>
            <p className="text-sm text-amber-200/80">
              You can add it to your cart to purchase, or go back to search.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleAddToCart}>
              Add to cart
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="size-4" /> Go back
            </Button>
          </div>
        </div>
      )}

      {/* Simplified Single-Column Layout */}
      <div className="space-y-6">
        {/* Domain summary */}
        <CartCard>
          <div className="flex flex-col gap-1">
            <div className="text-2xl md:text-3xl font-semibold break-all">
              {normalizedDomainName}
            </div>
            <div className="text-sm md:text-base text-muted-foreground">
              Duration: {minDuration} year{minDuration > 1 ? 's' : ''} • Free
            </div>
          </div>
        </CartCard>

        {/* Wallet selection */}
        {isAuthenticated ? (
          <NftWalletCard
            parentDomain={parentDomain}
            onWalletAddressChange={setSelectedWalletAddress}
            selectedWalletAddress={selectedWalletAddress}
            disabled={isClaimPending}
            isLinkedOrUserConfirmed={isLinkedOrUserConfirmed}
            onIsLinkedOrUserConfirmationChange={setIsLinkedOrUserConfirmed}
          />
        ) : null}

        {/* Login or Submit */}
        {!isAuthenticated ? (
          <AuthRequiredCard
            cartTotalInUsdCents={0}
            footerButton={<UserDropdown className="w-full" />}
          />
        ) : (
          <NamefiButton
            variant="default"
            className="w-full h-11 text-base"
            disabled={
              isClaimPending ||
              !availabilityInfo ||
              !isEligible ||
              !selectedWalletAddress ||
              !isLinkedOrUserConfirmed
            }
            onClick={handleSubmitClaim}
            size="lg"
          >
            {isClaimPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit
          </NamefiButton>
        )}
      </div>
    </PageShell>
  );
}
