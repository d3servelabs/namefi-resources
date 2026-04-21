'use client';

import {
  HEADER_ACTION_BUTTON_BASE_CLASS,
  HEADER_ACTION_BUTTON_BLUR_CLASS,
  HEADER_ACTION_BUTTON_ICON_CLASS,
  HEADER_ACTION_BUTTON_NO_BLUR_CLASS,
  HEADER_ACTION_BUTTON_PILL_CLASS,
} from '@/components/header.tokens';
import { Button } from '@namefi-astra/ui/components/shadcn/button';
import { cn } from '@namefi-astra/ui/lib/cn';
import { forwardRef, type ComponentProps } from 'react';

export type HeaderActionVariant = 'icon' | 'pill';

export interface HeaderActionButtonProps
  extends Omit<ComponentProps<typeof Button>, 'variant'> {
  actionVariant?: HeaderActionVariant;
  disableBackdropBlur?: boolean;
  stretch?: boolean;
}

export const HeaderActionButton = forwardRef<
  HTMLButtonElement,
  HeaderActionButtonProps
>(function HeaderActionButton(
  {
    actionVariant = 'icon',
    disableBackdropBlur = false,
    stretch = false,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        HEADER_ACTION_BUTTON_BASE_CLASS,
        actionVariant === 'icon'
          ? HEADER_ACTION_BUTTON_ICON_CLASS
          : HEADER_ACTION_BUTTON_PILL_CLASS,
        stretch ? 'w-full' : 'shrink-0',
        disableBackdropBlur
          ? HEADER_ACTION_BUTTON_NO_BLUR_CLASS
          : HEADER_ACTION_BUTTON_BLUR_CLASS,
        actionVariant === 'icon' ? 'justify-center' : 'justify-start',
        className,
      )}
      {...rest}
    >
      {children}
    </Button>
  );
});

HeaderActionButton.displayName = 'HeaderActionButton';
