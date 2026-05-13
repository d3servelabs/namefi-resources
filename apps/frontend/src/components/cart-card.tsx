'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@namefi-astra/ui/components/shadcn/card';
import { cn } from '@namefi-astra/ui/lib/cn';
import { switchCaseOrDefault } from '@namefi-astra/utils';
import { useMemo, type ReactNode } from 'react';

interface CartCardProps {
  title?: string;
  description?: string;
  headerAction?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  gradient?: 'none' | 'default' | 'minimal' | 'minimal-reverse';
}

export function CartCard({
  title,
  description,
  headerAction,
  children,
  footer,
  className,
  gradient = 'none',
}: CartCardProps) {
  const gradientFixtures = useMemo(
    () =>
      switchCaseOrDefault(
        gradient,
        {
          default: (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-brand-secondary/5 pointer-events-none" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            </>
          ),
          minimal: (
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 via-transparent to-transparent pointer-events-none" />
          ),
          'minimal-reverse': (
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-brand-primary/5 pointer-events-none" />
          ),
        },
        false,
      ),
    [gradient],
  );
  return (
    <Card
      className={cn(
        'shadow-sm rounded-lg p-6 gap-0',
        switchCaseOrDefault(
          gradient,
          {
            default:
              'relative overflow-hidden border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800',
            minimal: 'border-0 bg-zinc-900/50 overflow-hidden relative',
            'minimal-reverse':
              'border-0 bg-zinc-900/50 overflow-hidden relative',
            none: 'bg-white/[0.03] border border-white/10',
          },
          'bg-white/[0.03] border border-white/10',
        ),
        className,
      )}
    >
      {gradientFixtures}

      {(title || description || headerAction) && (
        <CardHeader
          className={cn(
            'p-0 pb-4',
            headerAction
              ? 'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'
              : undefined,
          )}
        >
          <div>
            {title && (
              <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
            )}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerAction && (
            <div className="sm:flex-shrink-0">{headerAction}</div>
          )}
        </CardHeader>
      )}
      {children && <CardContent className="p-0">{children}</CardContent>}
      {footer && <CardFooter className="p-0 pt-4">{footer}</CardFooter>}
    </Card>
  );
}
