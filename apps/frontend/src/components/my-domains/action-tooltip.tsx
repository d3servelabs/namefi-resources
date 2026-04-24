import type { FC, ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';

export const ActionTooltip: FC<{ label: string; children: ReactNode }> = ({
  label,
  children,
}) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      {children}
    </TooltipTrigger>
    <TooltipContent sideOffset={6}>{label}</TooltipContent>
  </Tooltip>
);
