'use client';

import { Input } from '@/components/ui/shadcn/input';
import { useCart } from '@/hooks/landing/use-cart';
import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { Loader2, SearchIcon } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import type { FC } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { NamefiButton } from './namefi-button';
import { Separator } from './ui/shadcn/separator';

interface DomainClaimProps {
  /**
   * The domain extension to show (e.g., "0x.city")
   */
  domain: string;
  /**
   * Optional callback when claim button is clicked
   */
  onClaim?: (subdomain: string) => void;
  /**
   * Optional custom title
   */
  title?: string;
  /**
   * Optional custom subtitle
   */
  subtitle?: string;
}

/**
 * A component that displays a domain claim interface with search input and claim button
 */
export const DomainClaim: FC<DomainClaimProps> = ({
  domain,
  onClaim,
  title = 'Your 0x Identity',
  subtitle = 'Become part of the Web3 citizen network',
}) => {
  const [subdomainValue, setSubdomainValue] = useState('');
  const [debouncedSubdomainValue, setDebouncedSubdomainValue] =
    useDebounceValue(subdomainValue, 500);

  const isSubdomainValueValid = useMemo(() => {
    return subdomainValue.length > 0 && subdomainValue.length > 3;
  }, [subdomainValue]);

  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  const { handleDomainAction, isAddingToCart } = useCart();

  const { data: qualifiesForPromo, isFetching: isQualifiesForPromoFetching } =
    useQuery({
      ...trpc.users.getUserQualifiesForDomainNamePromo.queryOptions({
        normalizedDomainName: `${debouncedSubdomainValue}.${domain}`,
      }),
      enabled: isAuthenticated && isSubdomainValueValid,
    });

  const { data: isDomainAvailable, isFetching: isDomainAvailableFetching } =
    useQuery({
      ...trpc.search.isDomainAvailable.queryOptions({
        domain: `${debouncedSubdomainValue}.${domain}`,
      }),
      enabled: isSubdomainValueValid,
    });

  const canClaim = useMemo(() => {
    return isSubdomainValueValid && isDomainAvailable && qualifiesForPromo;
  }, [isSubdomainValueValid, isDomainAvailable, qualifiesForPromo]);

  const buttonText = useMemo(() => {
    if (!isAuthenticated) {
      return 'Login to Claim';
    }
    if (isQualifiesForPromoFetching || isDomainAvailableFetching) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Checking...
        </>
      );
    }
    if (isAddingToCart) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" /> Claiming...
        </>
      );
    }
    return 'Claim Now';
  }, [
    isQualifiesForPromoFetching,
    isDomainAvailableFetching,
    isAddingToCart,
    isAuthenticated,
  ]);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSubdomainValue(e.target.value);
      setDebouncedSubdomainValue(e.target.value);
    },
    [setDebouncedSubdomainValue],
  );

  const handleClaim = useCallback(() => {
    if (
      subdomainValue &&
      subdomainValue.length > 0 &&
      qualifiesForPromo &&
      onClaim
    ) {
      handleDomainAction({
        domain: `${subdomainValue}.${domain}`,
        priceInUSD: 0,
      });
      if (onClaim) {
        onClaim(subdomainValue);
      }
    }
  }, [subdomainValue, domain, qualifiesForPromo, onClaim, handleDomainAction]);

  return (
    <div className="w-full max-w-4xl mx-auto p-16 justify-center items-center">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
        <p className="text-lg text-gray-300">{subtitle}</p>
      </div>

      <div className="flex md:flex-row flex-col items-center justify-between gap-2 border border-white/10 rounded-lg p-2">
        <div className="relative shrink-0 bg-black/40 h-14 flex items-center flex-1 rounded-md">
          <div className="absolute left-3 text-gray-400">
            <SearchIcon className="h-5 w-5" />
          </div>
          <Input
            placeholder="yourname"
            value={subdomainValue}
            onChange={onInputChange}
            className="pl-10 border-0 dark:bg-transparent h-full shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 text-lg"
          />
          <Separator orientation="vertical" className="mx-4 h-3" />
          <div className="mr-4 text-gray-400 text-lg">.{domain}</div>
        </div>
        <NamefiButton
          className="w-44 h-14"
          onClick={handleClaim}
          disabled={!canClaim}
        >
          {buttonText}
        </NamefiButton>
      </div>
    </div>
  );
};

export default DomainClaim;
