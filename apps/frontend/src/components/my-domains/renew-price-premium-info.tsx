'use client';

import { type FC, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

export const RenewPricePremiumInfo: FC<{ domainName: string }> = ({
  domainName,
}) => {
  const t = useTranslations('domains');
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={t('renewPremiumInfo.aria', { domain: domainName })}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
            data-testid="domains.renewal.premium-info"
          />
        }
      >
        !
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        {t('renewPremiumInfo.tooltip')}
      </TooltipContent>
    </Tooltip>
  );
};
