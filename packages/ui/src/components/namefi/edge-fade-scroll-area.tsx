'use client';

import type * as React from 'react';
import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

import { ScrollBar } from '@namefi-astra/ui/components/shadcn/scroll-area';
import { cn } from '@namefi-astra/ui/lib/cn';

type EdgeFadeScrollAreaProps = ScrollAreaPrimitive.Root.Props & {
  contentClassName?: string;
  viewportClassName?: string;
};

const verticalEdgeFadeMask =
  'linear-gradient(to bottom, transparent 0, black min(24px, var(--scroll-area-overflow-y-start, 0px)), black calc(100% - min(24px, var(--scroll-area-overflow-y-end, 24px))), transparent 100%)';

const verticalEdgeFadeViewportStyle = {
  WebkitMaskImage: verticalEdgeFadeMask,
  WebkitMaskRepeat: 'no-repeat',
  maskImage: verticalEdgeFadeMask,
  maskRepeat: 'no-repeat',
} satisfies React.CSSProperties;

function EdgeFadeScrollArea({
  className,
  children,
  contentClassName,
  overflowEdgeThreshold = 1,
  viewportClassName,
  ...props
}: EdgeFadeScrollAreaProps) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      overflowEdgeThreshold={overflowEdgeThreshold}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          'focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1',
          viewportClassName,
        )}
        style={verticalEdgeFadeViewportStyle}
      >
        <ScrollAreaPrimitive.Content
          data-slot="scroll-area-content"
          className={contentClassName}
        >
          {children}
        </ScrollAreaPrimitive.Content>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

export { EdgeFadeScrollArea };
