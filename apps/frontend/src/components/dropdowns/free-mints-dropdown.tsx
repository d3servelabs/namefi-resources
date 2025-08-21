'use client';

import { useMemo } from 'react';
import { Gift } from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
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
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';

export function FreeMintsDropdown({ className }: { className?: string }) {
  const { isAuthenticated } = useAuth();
  const trpc = useTRPC();

  const claimsQuery = useQuery({
    ...trpc.freeClaims.getUserClaims.queryOptions(),
    enabled: isAuthenticated,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { availableCount, singles, campaigns } = useMemo(() => {
    const data = claimsQuery.data;
    let count = 0;
    const singleClaims: Array<{
      id: string;
      domain: string;
      isExpired: boolean;
      claimingStatus: 'IDLE' | 'CLAIMING' | 'CLAIMED';
    }> = [];
    const campaignClaims: Array<{
      key: string;
      parentDomain: string;
      available: number;
    }> = [];
    if (data) {
      for (const item of data) {
        if (!item) continue;
        if (item.type === 'singleExactDomain') {
          const c = item.claim;
          const domain = c.exactDomainName ?? c.claimedDomainName;
          const isClaimable = !c.isExpired && c.claimingStatus === 'IDLE';
          if (domain && isClaimable) {
            singleClaims.push({
              id: c.id,
              domain,
              isExpired: c.isExpired,
              claimingStatus: c.claimingStatus,
            });
          }
          if (isClaimable) count += 1;
        } else if (item.type === 'campaignParentDomain') {
          const available = item.counts.available;
          if (available > 0) {
            campaignClaims.push({
              key: item.groupOrCampaignKey,
              parentDomain: String(item.parentDomain),
              available,
            });
            count += available;
          }
        }
      }
    }
    return {
      availableCount: count,
      singles: singleClaims,
      campaigns: campaignClaims,
    };
  }, [claimsQuery.data]);

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {isAuthenticated && availableCount > 0 ? (
        <motion.div
          layout
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className={cn('inline-flex', className)}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild={true}>
              <div className="relative">
                <ShinyButton
                  className="relative h-9 text-secondary-foreground hover:bg-sidebar-accent hover:backdrop-blur-none"
                  aria-label={`You have ${availableCount} free ${availableCount === 1 ? 'mint' : 'mints'} available`}
                >
                  <span className="flex items-center gap-2">
                    <Gift className="size-[18px]" />
                    Free {availableCount === 1 ? 'Mint' : 'Mints'}
                  </span>
                </ShinyButton>
                <Badge
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 
                    text-xs"
                  variant="destructive"
                >
                  <NumberFlow value={availableCount} />
                </Badge>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Free Mints</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {singles.map((s) => (
                  <DropdownMenuItem key={s.id} className="flex justify-between">
                    <span className="truncate">{s.domain}</span>
                    <Button
                      asChild={true}
                      size="sm"
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
                    >
                      <Link href={`/claim/${encodeURIComponent(s.domain)}`}>
                        <span className="inline-flex items-center gap-1">
                          Claim
                        </span>
                      </Link>
                    </Button>
                  </DropdownMenuItem>
                ))}
                {campaigns.map((c) => (
                  <DropdownMenuItem
                    key={`${c.key}-${c.parentDomain}`}
                    className="flex justify-between"
                  >
                    <span className="truncate">{c.parentDomain}</span>
                    <Button
                      asChild={true}
                      size="sm"
                      className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground"
                    >
                      <Link href="/free-claims">
                        <span className="inline-flex items-center gap-1">
                          Claim
                        </span>
                      </Link>
                    </Button>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
