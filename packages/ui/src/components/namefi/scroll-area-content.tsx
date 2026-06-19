'use client';

import { ScrollArea as ScrollAreaPrimitive } from '@base-ui/react/scroll-area';

function ScrollAreaContent({
  className,
  ...props
}: ScrollAreaPrimitive.Content.Props) {
  return (
    <ScrollAreaPrimitive.Content
      data-slot="scroll-area-content"
      className={className}
      {...props}
    />
  );
}

export { ScrollAreaContent };
