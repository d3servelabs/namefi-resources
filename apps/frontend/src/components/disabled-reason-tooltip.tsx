'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@namefi-astra/ui/components/shadcn/tooltip';
import { cn } from '@namefi-astra/ui/lib/cn';
import type { ReactNode } from 'react';

interface DisabledReasonTooltipProps {
  /**
   * When set, wraps children in a tooltip explaining why the action is
   * disabled. When undefined, children render unchanged (no tooltip).
   */
  reason?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a (typically disabled) control in a tooltip explaining why it can't be
 * used. The trigger is a wrapper span: a natively-disabled button doesn't emit
 * pointer events, so hovering the span surfaces the tooltip while the button
 * stays disabled.
 */
export function DisabledReasonTooltip({
  reason,
  children,
  className,
}: DisabledReasonTooltipProps) {
  if (!reason) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={(props) => (
          <span
            {...props}
            className={cn('block w-full', props.className, className)}
          >
            {children}
          </span>
        )}
      />
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}
