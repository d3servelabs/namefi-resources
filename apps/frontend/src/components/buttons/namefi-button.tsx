import { cn } from '@/lib/cn';
import type { ComponentProps } from 'react';
import { Button } from '../ui/shadcn/button';

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
