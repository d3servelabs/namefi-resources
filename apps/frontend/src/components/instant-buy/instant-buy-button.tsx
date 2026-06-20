'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Zap } from 'lucide-react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { useAuth } from '@/hooks/use-auth';
import type { DomainAvailabilityInfo } from '@namefi-astra/common/domain-availability';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import { useAdminFeatureFlag } from '../admin/feature-flags/use-flag';
import { INSTANT_BUY_FLAG } from '@/lib/openfeature-flags';

export interface InstantBuyButtonProps {
  domainAvailabilityInfo: DomainAvailabilityInfo;
  disabled?: boolean;
  className?: string;
}

type InstantBuyModalRuntimeComponent =
  typeof import('./instant-buy-modal-runtime').InstantBuyModalRuntime;

let instantBuyModalRuntimePromise: Promise<InstantBuyModalRuntimeComponent> | null =
  null;

function loadInstantBuyModalRuntime(): Promise<InstantBuyModalRuntimeComponent> {
  instantBuyModalRuntimePromise ??= import('./instant-buy-modal-runtime')
    .then((mod) => mod.InstantBuyModalRuntime)
    .catch((error) => {
      instantBuyModalRuntimePromise = null;
      throw error;
    });

  return instantBuyModalRuntimePromise;
}
export function InstantBuyButton(props: InstantBuyButtonProps) {
  const [instantBuy] = useAdminFeatureFlag(INSTANT_BUY_FLAG);
  if (!instantBuy) return null;
  return <InstantBuyButtonInner {...props} />;
}

export function InstantBuyButtonInner({
  domainAvailabilityInfo,
  disabled,
  className,
}: InstantBuyButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isModalRuntimeLoading, setIsModalRuntimeLoading] = useState(false);
  const [InstantBuyModalRuntime, setInstantBuyModalRuntime] =
    useState<InstantBuyModalRuntimeComponent | null>(null);
  const { isAuthenticated } = useAuth();
  const t = useTranslations('shared');

  const requestModalRuntime = useCallback(() => {
    if (InstantBuyModalRuntime) return;

    setIsModalRuntimeLoading(true);
    void loadInstantBuyModalRuntime()
      .then((Component) => {
        setInstantBuyModalRuntime(() => Component);
      })
      .catch(() => {
        setModalOpen(false);
      })
      .finally(() => {
        setIsModalRuntimeLoading(false);
      });
  }, [InstantBuyModalRuntime]);

  const handleClick = () => {
    if (!isAuthenticated) {
      // TODO: User not authenticated - the modal will handle showing auth required state
    }
    setModalOpen(true);
    requestModalRuntime();
  };
  if (!isAuthenticated) return null;

  const isOpeningModal = modalOpen && isModalRuntimeLoading;

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="default"
              className={cn(
                'group flex items-center justify-center px-1',
                className,
              )}
            />
          }
          onClick={handleClick}
          disabled={disabled || isOpeningModal}
        >
          {isOpeningModal ? (
            <Loader2 className="h-4 w-4 ms-1 animate-spin group-hover:ms-0" />
          ) : (
            <Zap className="h-4 w-4 ms-1 group-hover:ms-0" />
          )}
          <span
            className="origin-left w-0 group-hover:w-[calc-size(auto,size)] truncate"
            style={{ transition: 'all 0.4s ease-in-out' }}
          >
            {t('instantBuyModal.buyNow')}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('instantBuyModal.tooltip')}</p>
        </TooltipContent>
      </Tooltip>

      {InstantBuyModalRuntime && modalOpen ? (
        <InstantBuyModalRuntime
          open={modalOpen}
          onOpenChange={setModalOpen}
          domainAvailabilityInfo={domainAvailabilityInfo}
        />
      ) : null}
    </>
  );
}
