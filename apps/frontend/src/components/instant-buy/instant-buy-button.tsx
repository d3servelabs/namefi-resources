'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth } from '@/hooks/use-auth';
import { InstantBuyModal } from './instant-buy-modal';
import type { DomainAvailabilityInfo } from '@namefi-astra/contracts/domain-availability';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { cn } from '@/lib/cn';
import { useAdminFeatureFlag } from '../admin/feature-flags/use-flag';
import type { FeatureFlagDefinition } from '@/types/feature-flags';
import { useRegisterAdminFlags } from '@/components/admin/feature-flags/register';

export interface InstantBuyButtonProps {
  domainAvailabilityInfo: DomainAvailabilityInfo;
  disabled?: boolean;
  className?: string;
}
const FLAG_DEFINITION: FeatureFlagDefinition[] = [
  {
    key: 'instant_buy',
    label: 'Instant Buy',
    description: 'Show the instant buy button',
    scope: 'global',
    defaultValue: false,
  },
];
export function InstantBuyButton(props: InstantBuyButtonProps) {
  useRegisterAdminFlags(FLAG_DEFINITION);
  const [instantBuy] = useAdminFeatureFlag(FLAG_DEFINITION[0]);
  if (!instantBuy) return null;
  return <InstantBuyButtonInner {...props} />;
}

export function InstantBuyButtonInner({
  domainAvailabilityInfo,
  disabled,
  className,
}: InstantBuyButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleClick = () => {
    if (!isAuthenticated) {
      // TODO: User not authenticated - the modal will handle showing auth required state
    }
    setModalOpen(true);
  };
  if (!isAuthenticated) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleClick}
            disabled={disabled}
            variant="outline"
            size="default"
            className={cn(
              'group flex items-center justify-center px-1',
              className,
            )}
          >
            <Zap className="h-4 w-4 ml-1 group-hover:ml-0" />
            <span
              className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
              style={{ transition: 'all 0.4s ease-in-out' }}
            >
              Buy Now
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Purchase this domain instantly</p>
        </TooltipContent>
      </Tooltip>

      <InstantBuyModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        domainAvailabilityInfo={domainAvailabilityInfo}
      />
    </>
  );
}
