import { forwardRef, useMemo } from 'react';
import { Card } from '../shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';

type GradientType = 'default' | 'minimal';

type GradientDirection =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

export type GradientCardProps = React.ComponentProps<typeof Card> & {
  gradient?:
    | 'none'
    | 'minimal-reverse'
    | 'minimal-horizontal'
    | 'default'
    | 'minimal'
    | `${GradientType}-${GradientDirection}`;
};
export const GradientCard = forwardRef<HTMLDivElement, GradientCardProps>(
  function GradientCard({ children, gradient, ...props }, ref) {
    const gradientFixtures = useMemo(() => {
      switch (gradient) {
        case 'default':
          return (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </>
          );
        case 'default-top':
          return (
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-bottom':
          return (
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-l from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-bottom-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-top-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-bottom-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );
        case 'default-top-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
          );

        case 'minimal-horizontal':
          return (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-transparent to-brand-primary/5 pointer-events-none" />
          );
        case 'minimal':
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-bottom':
          return (
            <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-top':
          return (
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-l from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-bottom-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-top-left':
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );

        case 'minimal-bottom-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-top-right':
          return (
            <div className="absolute inset-0 bg-gradient-to-bl from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          );
        case 'minimal-reverse':
          return (
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-primary/5 pointer-events-none" />
          );
        default:
          return false;
      }
    }, [gradient]);
    const gradientClassName = useMemo(() => {
      switch (gradient) {
        case 'default-top':
          return 'relative overflow-hidden border-0 bg-gradient-to-t from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-bottom':
          return 'relative overflow-hidden border-0 bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-right':
          return 'relative overflow-hidden border-0 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-left':
          return 'relative overflow-hidden border-0 bg-gradient-to-l from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-top-right':
          return 'relative overflow-hidden border-0 bg-gradient-to-tr from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-bottom-right':
          return 'relative overflow-hidden border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-top-left':
          return 'relative overflow-hidden border-0 bg-gradient-to-tl from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default-bottom-left':
          return 'relative overflow-hidden border-0 bg-gradient-to-bl from-zinc-900 via-zinc-900 to-zinc-800';
        case 'default':
          return 'relative overflow-hidden border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800';

        case 'minimal-horizontal':
        case 'minimal-top':
        case 'minimal-bottom':
        case 'minimal-right':
        case 'minimal-left':
        case 'minimal-bottom-left':
        case 'minimal-bottom-right':
        case 'minimal-top-left':
        case 'minimal-top-right':
        case 'minimal':
          return 'border-0 bg-zinc-900/50 overflow-hidden relative';
        case 'minimal-reverse':
          return 'border-0 bg-zinc-900/50 overflow-hidden relative';
        case 'none':
          return 'bg-white/[0.03] border border-white/10';
        default:
          return 'bg-white/[0.03] border border-white/10';
      }
    }, [gradient]);

    return (
      <Card
        ref={ref}
        {...props}
        className={cn(gradientClassName, props.className)}
      >
        {gradientFixtures}
        {children}
      </Card>
    );
  },
);
