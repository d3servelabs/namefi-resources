import { cn } from '@namefi-astra/ui/lib/cn';
import type { ComponentProps } from 'react';
import { Button } from '@namefi-astra/ui/components/shadcn/button';

type NamefiButtonProps = ComponentProps<typeof Button>;

export function NamefiButton({
  children,
  className,
  ...props
}: NamefiButtonProps) {
  return (
    <Button
      className={cn(
        'bg-brand-primary text-secondary-foreground hover:bg-brand-primary/90 h-10 rounded-md py-2 px-8 gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
