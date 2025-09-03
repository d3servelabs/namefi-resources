'use client';

import { useCallback, useMemo } from 'react';
import { Gift } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFreeMints, type FreeMint } from '@/hooks/use-free-mints';
import { cn } from '@/lib/cn';
import { AnimatePresence, motion } from 'motion/react';
import NumberFlow from '@number-flow/react';
import { ShinyButton } from '@/components/buttons/shiny-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import Link from 'next/link';
import { useFreeMintsGuidance } from '@/components/providers/free-mints-guidance';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import { useRouter } from 'next/navigation';

export function FreeMintsDropdown({
  className,
  disableBackdropBlur = false,
}: {
  className?: string;
  disableBackdropBlur?: boolean;
}) {
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
            <DropdownMenuTrigger asChild={true}>
              <div className="relative">
                <ShinyButton
                  variant="ghost"
                  className={cn(
                    'relative h-9 text-secondary-foreground hover:bg-sidebar-accent shadow-none hover:backdrop-blur-none',
                    disableBackdropBlur && 'backdrop-blur-none',
                  )}
                  aria-label={`You have ${availableCount} free ${availableCount === 1 ? 'mint' : 'mints'} available`}
                >
                  <span className="flex items-center gap-2">
                    <Gift className="size-[18px]" />
                    Free {availableCount === 1 ? 'Mint' : 'Mints'}
                  </span>
                </ShinyButton>
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 
                    text-xs bg-brand-primary text-secondary-foreground"
                >
                  <NumberFlow value={availableCount} />
                </Badge>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Free Mints</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {availableFreeMints.map((freeMint) => (
                  <DropdownMenuItem
                    key={freeMint.id}
                    className="flex justify-between"
                    onClick={() => handleClaimAction(freeMint)}
                  >
                    <span className="truncate text-sm">
                      {freeMint.type === 'single' ? (
                        <>{freeMint.domain}</>
                      ) : freeMint.type === 'campaign' ? (
                        <>Any .{freeMint.domain}</>
                      ) : null}
                    </span>
                    <Button
                      size="sm"
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
                      onClick={() => handleClaimAction(freeMint)}
                    >
                      Claim
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild={true}>
                <Button className="w-full" variant="default" asChild={true}>
                  <Link href="/free-mints">View All Free Mints</Link>
                </Button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
