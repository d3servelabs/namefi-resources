'use client';

import { Input } from '@namefi-astra/ui/components/shadcn/input';
import { useCartRow } from '@/hooks/use-cart-row';
import { useIsMobile } from '@namefi-astra/ui/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { CheckIcon, Loader2, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import type { ChangeEvent, FC } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { useTranslations } from 'next-intl';
import { UserDropdown } from './dropdowns/user-dropdown';
import { NamefiButton } from '@namefi-astra/ui/components/namefi/namefi-button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@namefi-astra/ui/components/shadcn/accordion';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { Separator } from '@namefi-astra/ui/components/shadcn/separator';

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
  title,
  subtitle,
}) => {
  const t = useTranslations('claim');
  const tCommon = useTranslations('common');
  const resolvedTitle = title ?? t('widget.defaultTitle');
  const resolvedSubtitle = subtitle ?? t('widget.defaultSubtitle');
  const [subdomainValue, setSubdomainValue] = useState('');
  const [debouncedSubdomainValue, setDebouncedSubdomainValue] =
    useDebounceValue(subdomainValue, 500);
  const [isProcessing, setIsProcessing] = useState(false);

  const isMobile = useIsMobile();

  const isSubdomainValueValid = useMemo(() => {
    return subdomainValue.length > 0;
  }, [subdomainValue]);

  const trpc = useTRPC();
  const { isAuthenticated } = useAuth();

  const fullDomainName = `${subdomainValue}.${domain}`;
  const { cart, inCart } = useCartRow(fullDomainName);

  const { data: qualifiesForPromo, isFetching: isQualifiesForPromoFetching } =
    useQuery({
      ...trpc.users.getUserQualifiesForDomainNamePromo.queryOptions({
        normalizedDomainName: `${debouncedSubdomainValue}.${domain}`,
      }),
      enabled: isAuthenticated && isSubdomainValueValid,
    });

  const {
    data: domainAvailabilityInfo,
    isFetching: isDomainAvailableFetching,
  } = useQuery({
    ...trpc.search.isDomainAvailable.queryOptions({
      domain: `${debouncedSubdomainValue}.${domain}`,
    }),
    enabled: isSubdomainValueValid,
  });

  const {
    data: qualifyingDomainNamesForPromoWithLinkedAccountType,
    isFetching: isQualifyingDomainNamesForPromoFetching,
  } = useQuery({
    ...trpc.users.getUserQualifyingDomainNamesForPromo.queryOptions(),
    enabled: isAuthenticated,
  });

  const qualifyingDomainNamesForPromo = useMemo(() => {
    if (isQualifyingDomainNamesForPromoFetching) {
      return [];
    }

    return qualifyingDomainNamesForPromoWithLinkedAccountType?.map(
      (qualifyingDomainNameForPromoWithType) =>
        qualifyingDomainNameForPromoWithType.qualifyingDomainName,
    );
  }, [
    isQualifyingDomainNamesForPromoFetching,
    qualifyingDomainNamesForPromoWithLinkedAccountType,
  ]);

  const qualifyingDomainNamesText = useMemo(() => {
    if (isQualifyingDomainNamesForPromoFetching) {
      return t('widget.qualifying.checking');
    }

    if (qualifyingDomainNamesForPromo === undefined) {
      return t('widget.qualifying.error');
    }

    if (qualifyingDomainNamesForPromo?.length === 0) {
      return t('widget.qualifying.none');
    }

    return t('widget.qualifying.list', {
      domains: qualifyingDomainNamesForPromo
        .map((domainName) => `"${domainName}"`)
        .join(', '),
    });
  }, [
    isQualifyingDomainNamesForPromoFetching,
    qualifyingDomainNamesForPromo,
    t,
  ]);

  const canClaim = useMemo(() => {
    return (
      isSubdomainValueValid &&
      domainAvailabilityInfo &&
      qualifiesForPromo &&
      !inCart
    );
  }, [
    isSubdomainValueValid,
    domainAvailabilityInfo,
    qualifiesForPromo,
    inCart,
  ]);

  const buttonText = useMemo(() => {
    if (!isAuthenticated) {
      return t('widget.button.loginToClaim');
    }
    if (isQualifiesForPromoFetching || isDomainAvailableFetching) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('widget.button.checking')}
        </>
      );
    }
    if (inCart) {
      return (
        <>
          <CheckIcon className="w-4 h-4" /> {t('widget.button.inCart')}
        </>
      );
    }
    if (isProcessing) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />{' '}
          {t('widget.button.claiming')}
        </>
      );
    }
    return t('widget.button.claimNow');
  }, [
    isQualifiesForPromoFetching,
    isDomainAvailableFetching,
    isProcessing,
    isAuthenticated,
    inCart,
    t,
  ]);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSubdomainValue(e.target.value);
      setDebouncedSubdomainValue(e.target.value);
    },
    [setDebouncedSubdomainValue],
  );

  const handleClaim = useCallback(async () => {
    if (!domainAvailabilityInfo || !canClaim) return;

    setIsProcessing(true);
    try {
      await cart.addItem({
        domainAvailabilityInfo,
        durationInYears: 1,
        operationType: 'REGISTER',
      });
      onClaim?.(subdomainValue);
    } finally {
      setIsProcessing(false);
    }
  }, [domainAvailabilityInfo, canClaim, cart, onClaim, subdomainValue]);

  return (
    <div className="w-full max-w-4xl mx-auto p-16 justify-center items-center">
      <div className="flex flex-col items-center justify-center text-center mb-12">
        <h2 className="text-4xl font-bold text-secondary-foreground mb-2">
          {resolvedTitle}
        </h2>
        <p className="text-lg text-gray-300">{resolvedSubtitle}</p>
        <p className="text-gray-300 mb-2">{t('widget.qualifyPrompt')}</p>
        <Accordion className="w-full rounded-lg p-4 border ">
          <AccordionItem value="item-1">
            <AccordionTrigger>{tCommon('actions.signIn')}</AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                {isAuthenticated
                  ? t('widget.steps.signIn.signedIn')
                  : t('widget.steps.signIn.signedOut')}
              </p>
              {!isAuthenticated && <UserDropdown className="w-fit" />}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>
              {t('widget.steps.linkSocial.trigger')}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                {t('widget.steps.linkSocial.description')}
              </p>
              <Button
                data-testid="claim.widget.visit-profile"
                render={<Link href="/profile" />}
                nativeButton={false}
                size="sm"
                className="w-fit"
              >
                {t('widget.steps.linkSocial.visitProfile')}
              </Button>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>
              {t('widget.steps.enterDomain.trigger')}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-2">
              <p className="text-start">
                {t('widget.steps.enterDomain.description')}
              </p>
              <p className="text-start">{qualifyingDomainNamesText}</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex md:flex-row flex-col items-center justify-between gap-2 border border-white/10 rounded-lg p-2">
        <div className="relative shrink-0 bg-black/40 h-14 flex items-center flex-1 rounded-md">
          <div className="flex items-center justify-center w-full ps-2 gap-1 md:gap-2 h-14">
            <SearchIcon className="h-5 w-5 text-gray-400" />
            <Input
              data-testid="claim.widget.subdomain-input"
              placeholder={
                isMobile
                  ? t('widget.input.placeholderMobile')
                  : t('widget.input.placeholderDesktop')
              }
              value={subdomainValue}
              onChange={onInputChange}
              className="w-full px-0 border-0 dark:bg-transparent h-full shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 text-lg"
            />
          </div>
          <Separator orientation="vertical" className="mx-0.5 md:mx-4 h-3" />
          <div className="me-4 text-gray-400 text-lg">.{domain}</div>
        </div>
        <NamefiButton
          data-testid="claim.widget.claim-button"
          className="w-40 md:w-44 h-14"
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
