import { cn } from '@/lib/utils';
import type { VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { Button, type buttonVariants } from './ui/shadcn/button';

type NamefiButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function NamefiButton({
  children,
  className,
  ...props
}: NamefiButtonProps) {
  return (
    <Button
      className={cn(
        'bg-brand-primary text-white hover:bg-brand-primary/90 h-10 rounded-md py-2 px-4 gap-2',
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
