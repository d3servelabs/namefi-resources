'use client';

import { Input } from '@/components/ui/shadcn/input';
import { useCart } from '@/hooks/landing/use-cart';
import { useAuth } from '@/hooks/useAuth';
import { useTRPC } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, Loader2, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { UserDropdown } from './dropdowns/UserDropdown';
import { NamefiButton } from './namefi-button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/shadcn/accordion';
import { Button } from './ui/shadcn/button';
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
    return subdomainValue.length > 0;
  }, [subdomainValue]);

  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  const { handleDomainAction, isAddingToCart, isDomainInCart } = useCart();

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
    return (
      isSubdomainValueValid &&
      isDomainAvailable &&
      qualifiesForPromo &&
      !isDomainInCart(`${subdomainValue}.${domain}`)
    );
  }, [
    isSubdomainValueValid,
    isDomainAvailable,
    qualifiesForPromo,
    isDomainInCart,
    subdomainValue,
    domain,
  ]);

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
    if (isDomainInCart(`${subdomainValue}.${domain}`)) {
      return (
        <>
          <CheckIcon className="w-4 h-4" /> In Cart
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
    isDomainInCart,
    subdomainValue,
    domain,
  ]);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSubdomainValue(e.target.value);
      setDebouncedSubdomainValue(e.target.value);
    },
    [setDebouncedSubdomainValue],
  );

  const handleClaim = useCallback(() => {
    if (canClaim) {
      handleDomainAction({
        domain: `${subdomainValue}.${domain}`,
        priceInUSD: 0,
      });
      if (onClaim) {
        onClaim(subdomainValue);
      }
    }
  }, [canClaim, handleDomainAction, onClaim, subdomainValue, domain]);

  return (
    <div className="w-full max-w-4xl mx-auto p-16 justify-center items-center">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-2">{title}</h2>
        <p className="text-lg text-gray-300">{subtitle}</p>
        <p className="text-gray-300 mb-2">
          Follow the steps below to see if you qualify
        </p>
        <Accordion
          type="single"
          collapsible={true}
          className="w-full rounded-lg p-4 border "
        >
          <AccordionItem value="item-1">
            <AccordionTrigger>Sign In</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                {isAuthenticated
                  ? 'Thanks for signing in! You can proceed to the next step.'
                  : 'Sign in or create an account to get started.'}
              </p>
              {!isAuthenticated && <UserDropdown className="w-fit" />}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Link Social Media</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                Link a social media account with a qualifying username by
                visiting your profile page. For now, usernames that start with
                "0x" qualify you for the promo.
              </p>
              <Button asChild={true} size={'sm'} className="w-fit">
                <Link href={'/profile'}>Visit Profile Page</Link>
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Enter Domain Name</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                Enter your qualifying social media username without "0x" below.
                (Ex: if your username is "0xResident", enter "Resident" below.)
                If the domain name is available, you'll be able to claim it for
                free!
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
