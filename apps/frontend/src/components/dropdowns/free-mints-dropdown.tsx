'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Gift } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints, type FreeMint } from '@/hooks/use-free-mints';
import { cn } from '@namefi-astra/ui/lib/cn';
import { AnimatePresence, motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { HeaderActionButton } from '@/components/header-action-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@namefi-astra/ui/components/shadcn/dropdown-menu';
import Link from 'next/link';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useRouter } from 'next/navigation';
import { HEADER_BADGE_CLASS } from '@/components/header.tokens';

export function FreeMintsDropdown({
  className,
  disableBackdropBlur = false,
}: {
  className?: string;
  disableBackdropBlur?: boolean;
}) {
  const t = useTranslations('freeMints');
  const { isAuthenticated } = useAuth();
  const { startCampaignSearch } = useFreeMintsGuidance();
  const router = useRouter();

  const { availableCount, freeMints } = useFreeMints({
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  // Filter for available free mints only
  const availableFreeMints = useMemo(() => {
    return freeMints.filter(
      (item) => !item.isExpired && item.claimingStatus === 'IDLE',
    );
  }, [freeMints]);

  // Handle claim action
  const handleClaimAction = useCallback(
    (freeMint: FreeMint) => {
      if (freeMint.type === 'single') {
        router.push(`/claim/${encodeURIComponent(freeMint.domain)}`);
      } else if (freeMint.type === 'campaign') {
        startCampaignSearch(freeMint.domain);
      }
    },
    [startCampaignSearch, router],
  );

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {isAuthenticated && availableCount > 0 ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -12 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.35, ease: 'easeOut' },
          }}
          exit={{
            opacity: 0,
            y: -12,
            transition: { duration: 0.25, ease: 'easeIn' },
          }}
          className={cn('inline-flex', className)}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <HeaderActionButton
                  actionVariant="icon"
                  disableBackdropBlur={disableBackdropBlur}
                  data-testid="freeMints.dropdown.trigger"
                  className="text-white/90"
                  aria-label={`You have ${availableCount} free ${availableCount === 1 ? 'mint' : 'mints'} available`}
                />
              }
            >
              <Gift className="h-5 w-5" />
              <span className={HEADER_BADGE_CLASS}>
                <NumberFlow value={availableCount} />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t('dropdown.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableFreeMints.map((freeMint) => (
                  <DropdownMenuItem
                    key={freeMint.id}
                    data-testid={`freeMints.dropdown.item.${freeMint.id}`}
                    className="flex justify-between"
                    onClick={() => handleClaimAction(freeMint)}
                  >
                    <span className="truncate text-sm">
                      {freeMint.type === 'single'
                        ? freeMint.domain
                        : freeMint.type === 'campaign'
                          ? `Choose a .${freeMint.domain}` //TODO reflect if premium is allowed or not
                          : null}
                    </span>
                    <Button
                      size="sm"
                      data-testid={`freeMints.dropdown.claim.${freeMint.id}`}
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-black"
                      onClick={() => handleClaimAction(freeMint)}
                    >
                      {t('dropdown.claim')}
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={<Link href="/free-mints" />}
                data-testid="freeMints.dropdown.view-all"
                className="bg-primary text-primary-foreground justify-center hover:bg-primary/80 focus:bg-primary/80"
              >
                {t('dropdown.viewAll')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
