'use client';

import { type FC, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

export const RenewPricePremiumInfo: FC<{ domainName: string }> = ({
  domainName,
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={`Renewal price info for ${domainName}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className="inline-flex size-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-semibold leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
          />
        }
      >
        !
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        Premium domains may have a different renewal price.
      </TooltipContent>
    </Tooltip>
  );
};
